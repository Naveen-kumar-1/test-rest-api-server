import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
    {
        keyHash: { type: String, required: true, unique: true, index: true },
        keyPrefix: { type: String, required: true },
        permission: {
            type: String,
            enum: ["read", "read_write"],
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("ApiKey", apiKeySchema);
