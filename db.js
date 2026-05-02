import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI;

/**
 * Cached connection for serverless (Vercel): reuse across invocations.
 */
let cached = globalThis.__mongooseCache;

if (!cached) {
    cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
    if (!MONGODB_URI) {
        throw new Error("MONGO_URI is not set");
    }
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
        };
        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((m) => m);
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
};

export default connectDB;
