import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in .env.local');

  // Reuse connection across hot reloads in dev
  if (global._mongooseConn) return global._mongooseConn;

  global._mongooseConn = mongoose.connect(uri);
  return global._mongooseConn;
}
