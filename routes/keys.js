import { Router } from "express";
import ApiKey from "../models/ApiKey.js";
import {
    generateRawApiKey,
    hashApiKey,
    keyPrefixDisplay,
} from "../utils/keyUtils.js";
import { requireWriteApiKey } from "../middleware/requireApiKey.js";

const router = Router();

function publicKeyMeta(doc) {
    return {
        id: doc._id.toString(),
        prefix: doc.keyPrefix,
        permission: doc.permission,
        status: doc.status,
        created_at: doc.createdAt.toISOString(),
        expires_at: doc.expiresAt
            ? doc.expiresAt.toISOString()
            : null,
    };
}

/** POST /api/keys — generate (no auth; bootstrap new keys from UI) */
router.post("/", async (req, res) => {
    try {
        let { permission, expiresInDays } = req.body || {};

        if (permission === "read_only") permission = "read";
        if (permission !== "read" && permission !== "read_write") {
            return res.status(400).json({
                error: "permission must be 'read' or 'read_write'",
            });
        }

        let expiresAt = null;
        if (expiresInDays != null) {
            const n = Number(expiresInDays);
            if (Number.isFinite(n) && n > 0 && n <= 365) {
                expiresAt = new Date(
                    Date.now() + n * 24 * 60 * 60 * 1000
                );
            }
        }

        const raw = generateRawApiKey();
        const keyHash = hashApiKey(raw);
        const keyPrefix = keyPrefixDisplay(raw);

        const doc = await ApiKey.create({
            keyHash,
            keyPrefix,
            permission,
            status: "active",
            expiresAt,
        });

        return res.status(201).json({
            key: raw,
            key_id: doc._id.toString(),
            permission: doc.permission,
            created_at: doc.createdAt.toISOString(),
            expires_at: doc.expiresAt
                ? doc.expiresAt.toISOString()
                : null,
            warning:
                "Copy this key now. You will not be able to see the full secret again.",
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/** GET /api/keys — list keys (metadata only; requires read_write key) */
router.get("/", requireWriteApiKey, async (req, res) => {
    try {
        const list = await ApiKey.find()
            .sort({ createdAt: -1 })
            .lean();
        res.json({ keys: list.map((k) => publicKeyMeta(k)) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/** DELETE /api/keys/:id — revoke (requires read_write key) */
router.delete("/:id", requireWriteApiKey, async (req, res) => {
    try {
        const doc = await ApiKey.findByIdAndUpdate(
            req.params.id,
            { status: "inactive" },
            { new: true }
        );
        if (!doc) {
            return res.status(404).json({ error: "Key not found" });
        }
        res.json({ ok: true, id: doc._id.toString(), status: doc.status });
    } catch (err) {
        res.status(400).json({ error: "Invalid id" });
    }
});

export default router;
