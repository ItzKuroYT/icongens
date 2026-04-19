const crypto = require("crypto");
const { getUsers } = require("../_userStore");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalize(value) {
  return String(value || "").trim();
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.length > 0) {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return null;
    }
  }

  return null;
}

function verifyPassword(password, salt, passwordHash) {
  return new Promise(function (resolve, reject) {
    crypto.scrypt(password, salt, 64, function (error, derivedKey) {
      if (error) {
        reject(error);
        return;
      }

      const incoming = Buffer.from(derivedKey.toString("hex"), "hex");
      const stored = Buffer.from(String(passwordHash || ""), "hex");

      if (incoming.length !== stored.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(incoming, stored));
    });
  });
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const payload = getBody(req);
  if (!payload) {
    res.status(400).json({ ok: false, message: "Invalid request body" });
    return;
  }

  const username = normalize(payload.username);
  const password = String(payload.password || "");

  if (!username || !password) {
    res.status(400).json({ ok: false, message: "Username and password are required." });
    return;
  }

  try {
    const users = await getUsers();
    const user = users.find(function (entry) {
      return entry.usernameKey === username.toLowerCase();
    });

    if (!user) {
      res.status(401).json({ ok: false, message: "Invalid username or password." });
      return;
    }

    const valid = await verifyPassword(password, user.salt, user.passwordHash);
    if (!valid) {
      res.status(401).json({ ok: false, message: "Invalid username or password." });
      return;
    }

    res.status(200).json({
      ok: true,
      message: "Login successful.",
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Login failed. Please try again." });
  }
};