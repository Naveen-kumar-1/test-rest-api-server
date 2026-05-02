import ApiKey from "../models/ApiKey.js";
import { extractApiKey, hashApiKey } from "../utils/keyUtils.js";

function isExpired(doc) {
    return doc.expiresAt != null && doc.expiresAt.getTime() < Date.now();
}

/**
 * Validates x-api-key / Authorization Bearer for /api/users routes.
 * read → GET only; read_write → all methods.
 */
export async function requireApiKeyForUsers(req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    const raw = extractApiKey(req);
    if (!raw) {
        return res.status(401).json({
            error: "Missing API key",
            hint: "Send header x-api-key or Authorization: Bearer <key>",
        });
    }

    const keyHash = hashApiKey(raw);

    try {
        const doc = await ApiKey.findOne({ keyHash, status: "active" }).exec();

        if (!doc) {
            return res.status(401).json({
                error: "Invalid or revoked API key",
            });
        }

        if (isExpired(doc)) {
            return res.status(401).json({
                error: "API key has expired",
            });
        }

        const writeOps = new Set(["POST", "PUT", "PATCH", "DELETE"]);
        if (writeOps.has(req.method) && doc.permission !== "read_write") {
            return res.status(403).json({
                error:
                    "This API key is read-only; create a Read & Write key for mutations",
            });
        }

        req.apiKeyDoc = doc;
        next();
    } catch (err) {
        next(err);
    }
}

export async function requireWriteApiKey(req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }

    const raw = extractApiKey(req);
    if (!raw) {
        return res.status(401).json({ error: "Missing API key" });
    }

    const keyHash = hashApiKey(raw);

    try {
        const doc = await ApiKey.findOne({ keyHash, status: "active" }).exec();

        if (!doc || isExpired(doc)) {
            return res.status(401).json({ error: "Invalid or expired API key" });
        }

        if (doc.permission !== "read_write") {
            return res.status(403).json({
                error: "This action requires a Read & Write API key",
            });
        }

        req.authApiKey = doc;
        next();
    } catch (err) {
        next(err);
    }
}
