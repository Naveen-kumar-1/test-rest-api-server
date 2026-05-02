import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import usersRouter from "./routes/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error(err);
        res.status(503).json({
            error: "Database unavailable",
            details:
                process.env.NODE_ENV === "development"
                    ? String(err.message)
                    : undefined,
        });
    }
});

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRouter);
app.use(express.static(rootDir));

export default app;
