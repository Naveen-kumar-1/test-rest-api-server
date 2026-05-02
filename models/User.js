import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        password: { type: String, required: true },
        mobile_number: { type: String, default: "" },
        address: { type: String, default: "" },
        bio: { type: String, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
