import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | null;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

// Reuse connection across hot reloads in dev
let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = null;
}

export async function connectDB() {
  if (cached) return cached;

  cached = global._mongooseConn = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  return cached;
}
