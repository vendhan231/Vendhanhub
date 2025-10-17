import dotenv from 'dotenv';

dotenv.config();

const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
};

export default config;