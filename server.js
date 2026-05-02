import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import usersRouter from "./routes/users.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRouter);
// Must be before express.static, or static will send index.html for GET /
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use(
  express.static(rootDir, {
    index: false,
  })
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
