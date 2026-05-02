import "./load-env.js";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import connectDB from "./db.js";
import usersRouter from "./routes/users.js";
import keysRouter from "./routes/keys.js";
import { requireApiKeyForUsers } from "./middleware/requireApiKey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", 1);

app.use(
    cors({
        origin: true,
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/keys", keysRouter);
app.use("/api/users", requireApiKeyForUsers);
app.use("/api/users", usersRouter);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use(
    express.static(rootDir, {
        index: false,
    })
);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
});

async function start() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
});
