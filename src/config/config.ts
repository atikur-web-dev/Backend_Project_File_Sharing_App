import dotenv from 'dotenv';


dotenv.config();

const _config = {
  port: process.env.PORT || 4000,
  APP_URL: `${process.env.APP_URL}:${process.env.PORT}` || `http://localhost:4000 : ${process.env.PORT}`,
};

export const config = Object.freeze(_config);