import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  // Reuse connection across hot reloads (dev) and across invocations (Vercel serverless)
  if (global._mongooseConn) return global._mongooseConn;

  global._mongooseConn = mongoose.connect(uri, {
    bufferCommands: false,    // fail fast if not connected — good for serverless
    maxPoolSize: 10,          // Atlas free tier supports up to 500 connections
    serverSelectionTimeoutMS: 5000,
  });

  return global._mongooseConn;
}
