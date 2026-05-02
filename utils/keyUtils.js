import crypto from "crypto";

const PREFIX = "rk_live_";

export function generateRawApiKey() {
    const secret = crypto.randomBytes(32).toString("hex");
    return PREFIX + secret;
}

export function hashApiKey(rawKey) {
    return crypto.createHash("sha256").update(rawKey, "utf8").digest("hex");
}

export function extractApiKey(req) {
    const auth = req.headers.authorization;
    if (auth && /^Bearer\s+/i.test(auth)) {
        return auth.replace(/^Bearer\s+/i, "").trim();
    }
    const headerKey = req.headers["x-api-key"];
    if (typeof headerKey === "string" && headerKey.trim()) {
        return headerKey.trim();
    }
    return null;
}

export function keyPrefixDisplay(rawKey, visibleChars = 14) {
    const slice = rawKey.slice(0, visibleChars);
    return slice.length < rawKey.length ? `${slice}…` : slice;
}
