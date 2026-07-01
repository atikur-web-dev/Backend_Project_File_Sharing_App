import {
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentConfig,
} from '@google/genai';
import ai from '../config/ai.js';
import { convertToBase64 } from '../utils/image.helper.js';
import { uploadBufferToCloudinary } from './cloudinary.service.js';
import { logger } from '../config/logger.js';
import type { Express } from 'express';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import axios from 'axios';
import { cloudinary } from '../lib/cloudinary.js';
import { logger } from '../config/logger.js';
import type { Project } from '@prisma/client';

interface GenerateImageInput {
  userPrompt?: string;
  aspectRatio?: string;
}

export const generateImageWithAI = async (
  productImage: Express.Multer.File,
  modelImage: Express.Multer.File,
  body: GenerateImageInput
): Promise<string> => {
  try {
    // 1. Safety settings (প্রোডাকশন গ্রেড)
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: body.aspectRatio || '9:16',
        imageSize: '1k',
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    };

    // 2. Convert images to base64
    const product = convertToBase64(productImage.path, productImage.mimetype);
    const model = convertToBase64(modelImage.path, modelImage.mimetype);

    // 3. Build prompt
    const userPrompt = body.userPrompt || '';
    const promptText = `Combine the person and product into realistic e-commerce imagery. Make the person naturally hold or use the product. Match lighting, shadows, scale and perspective. Make the person stand in professional studio lighting. Output e-commerce quality image realistic imagery ${userPrompt}`;

    const contents = [{ text: promptText }, product, model];

    // 4. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: generationConfig,
    });

    // 5. Extract image buffer
    const parts = response?.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error('No image generated');
    }

    let buffer: Buffer | null = null;
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data as string;
        buffer = Buffer.from(imageData, 'base64');
        break;
      }
    }

    if (!buffer) {
      throw new Error('Image generation failed');
    }

    // 6. Upload to Cloudinary
    const url = await uploadBufferToCloudinary(buffer);

    logger.info('Image generated and uploaded successfully');
    return url;
  } catch (error) {
    logger.error('AI generation failed:', error);
    throw new Error('Failed to generate image');
  }
};

// ============ Video Generation ============

const VIDEO_POLL_INTERVAL = 10000; // 10 seconds
const MAX_POLL_ATTEMPTS = 30; // 5 minutes

export const generateVideoWithAI = async (project: Project): Promise<string> => {
  try {
    logger.info(`🎬 Starting video generation for project: ${project.id}`);

    // 1. Validate
    if (!project.generatedImage) {
      throw new Error('Generated image not found. Generate image first.');
    }

    // 2. Build prompt
    const prompt = `Show the person holding the ${project.productName} naturally. Professional studio lighting. E-commerce style. ${project.productDescription || ''}`;

    // 3. Download image
    const imageResponse = await axios.get(project.generatedImage, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // 4. Start video generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt,
      image: {
        imageBytes: imageBuffer.toString('base64'),
        mimeType: 'image/png',
      },
      config: {
        aspectRatio: project.aspectRatio || '9:16',
        numberOfVideos: 1,
        resolution: '720p',
      },
    });

    // 5. Poll for completion
    let attempts = 0;
    while (!operation.done && attempts < MAX_POLL_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL));
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      attempts++;
      logger.info(`⏳ Video progress: ${attempts * 10}s`);
    }

    if (!operation.done) {
      throw new Error('Video generation timed out after 5 minutes');
    }

    // 6. Check for safety filters
    if (operation?.response?.raiMediaFilteredReasons?.length) {
      throw new Error(operation.response.raiMediaFilteredReasons[0]);
    }

    if (!operation?.response?.generatedVideos?.[0]?.video) {
      throw new Error('No video generated');
    }

    // 7. Download video
    const videosDir = path.resolve(process.cwd(), 'videos');
    mkdirSync(videosDir, { recursive: true });

    const fileName = `video-${Date.now()}-${project.id}.mp4`;
    const filePath = path.join(videosDir, fileName);

    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: filePath,
    });

    // 8. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: 'ai-shorts/videos',
      resource_type: 'video',
      public_id: `video-${project.id}`,
    });

    // 9. Cleanup
    try {
      rmSync(filePath, { force: true });
      rmSync(videosDir, { recursive: true, force: true });
    } catch (cleanupError) {
      logger.warn('⚠️ Video cleanup warning:', cleanupError);
    }

    logger.info(`✅ Video generated: ${uploadResult.secure_url}`);
    return uploadResult.secure_url;
  } catch (error) {
    logger.error('❌ Video generation failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate video'
    );
  }
};
