import mongoose from "mongoose";

let cached = globalThis.__mongooseConnection;

if (!cached) {
    cached = globalThis.__mongooseConnection = {
        conn: null,
        promise: null,
    };
}

function getMongoUri() {
    const uri =
        process.env.MONGO_URI?.trim() ||
        process.env.MONGODB_URI?.trim() ||
        "";
    return uri;
}

/**
 * Connect once and reuse the pool. Safe to call multiple times.
 * Throws if URI is missing or Atlas/network rejects the connection.
 */
async function connectDB() {
    const uri = getMongoUri();
    if (!uri) {
        throw new Error(
            "Missing MONGO_URI (or MONGODB_URI). Add it to .env in this folder."
        );
    }

    mongoose.set("strictQuery", true);

    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 8_000,
                socketTimeoutMS: 45_000,
                family: 4,
            })
            .then((m) => {
                console.log("MongoDB connected");
                return m;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        cached.conn = null;
        console.error("MongoDB connection failed:", err.message);
        throw err;
    }

    return cached.conn;
}

export default connectDB;
