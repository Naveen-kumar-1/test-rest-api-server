import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = Router();
const SALT_ROUNDS = 10;

function toPublicUser(doc) {
    return {
        id: doc._id.toString(),
        username: doc.username,
        email: doc.email,
        mobile_number: doc.mobile_number || "",
        address: doc.address || "",
        bio: doc.bio || "",
        created_at: doc.createdAt.toISOString(),
    };
}

/** GET /api/users — list all users */
router.get("/", async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        res.json(users.map((u) => toPublicUser(u)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** GET /api/users/:id — single user */
router.get("/:id", async (req, res) => {
    try {
        const doc = await User.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: "User not found" });
        res.json(toPublicUser(doc));
    } catch (err) {
        res.status(400).json({ error: "Invalid id" });
    }
});

/**
 * POST /api/users — create OR update (same route).
 * If email exists → update that user; otherwise create (password required for new).
 */
router.post("/", async (req, res) => {
    try {
        const { username, email, password, mobile_number, address, bio } =
            req.body;

        if (!username || !email) {
            return res
                .status(400)
                .json({ error: "username and email are required" });
        }

        const emailNorm = String(email).trim().toLowerCase();
        const existing = await User.findOne({ email: emailNorm });

        if (existing) {
            existing.username = username.trim();
            existing.mobile_number =
                mobile_number != null ? String(mobile_number) : "";
            existing.address = address != null ? String(address) : "";
            existing.bio = bio != null ? String(bio) : "";

            if (password != null && String(password).trim().length > 0) {
                if (String(password).length < 6) {
                    return res.status(400).json({
                        error: "password must be at least 6 characters",
                    });
                }
                existing.password = await bcrypt.hash(password, SALT_ROUNDS);
            }

            await existing.save();

            return res.status(200).json({
                ...toPublicUser(existing),
                updated: true,
            });
        }

        if (!password || String(password).trim().length === 0) {
            return res.status(400).json({
                error:
                    "password is required when creating a user with a new email",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                error: "password must be at least 6 characters",
            });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const doc = await User.create({
            username: username.trim(),
            email: emailNorm,
            password: hash,
            mobile_number: mobile_number != null ? String(mobile_number) : "",
            address: address != null ? String(address) : "",
            bio: bio != null ? String(bio) : "",
        });

        return res.status(201).json({
            ...toPublicUser(doc),
            created: true,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Email conflict" });
        }
        res.status(400).json({ error: err.message });
    }
});

/** DELETE /api/users/:id */
router.delete("/:id", async (req, res) => {
    try {
        const doc = await User.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: "User not found" });
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: "Invalid id" });
    }
});

export default router;
