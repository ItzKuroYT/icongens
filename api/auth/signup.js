const crypto = require("crypto");
const { getUsers, saveUsers } = require("../_userStore");

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

function validate(payload) {
  const username = normalize(payload.username);
  const email = normalize(payload.email).toLowerCase();
  const password = String(payload.password || "");

  if (username.length < 3 || username.length > 24) {
    return { ok: false, message: "Username must be between 3 and 24 characters." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { ok: false, message: "Username can only contain letters, numbers, and underscore." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "A valid email is required." };
  }

  if (password.length < 8 || password.length > 72) {
    return { ok: false, message: "Password must be between 8 and 72 characters." };
  }

  return {
    ok: true,
    data: {
      username,
      usernameKey: username.toLowerCase(),
      email,
      password
    }
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  return new Promise(function (resolve, reject) {
    crypto.scrypt(password, salt, 64, function (error, derivedKey) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        salt,
        passwordHash: derivedKey.toString("hex")
      });
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

  const validated = validate(payload);
  if (!validated.ok) {
    res.status(400).json({ ok: false, message: validated.message });
    return;
  }

  try {
    const users = await getUsers();
    const exists = users.some(function (user) {
      return (
        user.usernameKey === validated.data.usernameKey ||
        user.email === validated.data.email
      );
    });

    if (exists) {
      res.status(409).json({ ok: false, message: "Username or email already exists." });
      return;
    }

    const hashed = await hashPassword(validated.data.password);
    const nextUsers = users.concat({
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      username: validated.data.username,
      usernameKey: validated.data.usernameKey,
      email: validated.data.email,
      passwordHash: hashed.passwordHash,
      salt: hashed.salt,
      createdAt: new Date().toISOString()
    });

    const saved = await saveUsers(nextUsers);
    if (!saved) {
      throw new Error("User data could not be persisted.");
    }

    res.status(201).json({
      ok: true,
      message: "Account created successfully.",
      user: {
        username: validated.data.username,
        email: validated.data.email
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Signup failed. Please try again." });
  }
};