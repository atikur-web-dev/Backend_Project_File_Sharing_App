import { Request, Response } from 'express';
import { generateImageWithAI } from '../services/ai.service.js';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';
import { unlink } from 'fs/promises';
import { CreditService } from '../services/credit.service.js';
import { generateVideoWithAI } from '../services/ai.service.js';


export const createProject = async (req: Request, res: Response) => {
  let creditDeducted = false;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // 1. Check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userSubcription: true },
    });

    if (!user?.userSubcription || user.userSubcription.credits < 5) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits. Need at least 5 credits.',
      });
    }

    // 2. Get uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const productImage = files?.productImage?.[0];
    const modelImage = files?.modelImage?.[0];

    if (!productImage || !modelImage) {
      return res.status(400).json({
        success: false,
        message: 'Both product and model images are required',
      });
    }

    // 3. Deduct credits
    await prisma.userSubscription.update({
      where: { id: user.userSubcription.id },
      data: { credits: { decrement: 5 } },
    });
    creditDeducted = true;

    // 4. Upload product & model images to Cloudinary
    const [productUrl, modelUrl] = await Promise.all([
      uploadToCloudinary(productImage.path),
      uploadToCloudinary(modelImage.path),
    ]);

    // 5. Create project record
    const project = await prisma.project.create({
      data: {
        projectName: req.body.projectName || 'Untitled',
        productName: req.body.productName || 'Product',
        productDescription: req.body.productDescription || null,
        userPrompt: req.body.userPrompt || null,
        productImage: productUrl,
        modelImage: modelUrl,
        generatedImage: '',
        generatedVideo: '',
        aspectRatio: req.body.aspectRatio || '9:16',
        userId,
      },
    });

    // 6. Generate AI image
    const generatedImage = await generateImageWithAI(
      productImage,
      modelImage,
      {
        userPrompt: req.body.userPrompt,
        aspectRatio: req.body.aspectRatio,
      }
    );

    // 7. Update project with generated image
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: { generatedImage },
    });

    // 8. Cleanup temp files
    await unlink(productImage.path).catch(() => {});
    await unlink(modelImage.path).catch(() => {});

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    // Refund credits if failed
    if (creditDeducted) {
      await prisma.userSubscription.update({
        where: { userId },
        data: { credits: { increment: 5 } },
      });
    }

    logger.error('Project creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Project creation failed. Credits refunded.',
    });
  }
};

// ============ Video Generation Controller ============
export const generateVideo = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { projectId } = req.body;

  // 1. Validation
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Project ID is required and must be a string',
    });
  }

  let creditDeducted = false;

  try {
    // 2. Check credits (10 credits needed)
    const hasCredits = await CreditService.checkCredits(userId, 10);
    if (!hasCredits) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits. Need 10 credits for video generation.',
      });
    }

    // 3. Get project (with ownership check)
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or you do not have access',
      });
    }

    // 4. Idempotency check - prevent duplicate generation
    if (project.generatedVideo) {
      return res.status(400).json({
        success: false,
        message: 'Video already generated for this project',
        data: { videoUrl: project.generatedVideo },
      });
    }

    // 5. Deduct credits
    await CreditService.deductCredits(userId, 10);
    creditDeducted = true;

    // 6. Generate video
    const videoUrl = await generateVideoWithAI(project);

    // 7. Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { generatedVideo: videoUrl },
    });

    // 8. Success response
    res.json({
      success: true,
      message: 'Video generated successfully',
      data: updatedProject,
    });
  } catch (error) {
    // 9. Refund credits on failure
    if (creditDeducted) {
      await CreditService.refundCredits(userId, 10);
      logger.info(`🔄 Credits refunded for user ${userId} (video failed)`);
    }

    logger.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Video generation failed. Credits refunded.',
    });
  }
};