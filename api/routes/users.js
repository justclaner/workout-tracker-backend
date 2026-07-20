import { Router } from "express";
import { hashString } from "../util/hash.js";
import db from "../../db/database.js";
import { hash } from "bcrypt";
import bcrypt from "bcrypt";
const router = Router();

// Route: /api/users

// Get all the users
router.get("/", async (req, res, next) => {
  try {
    const users = await db.prepare("SELECT * FROM users;").all();
    return res.status(200).json({ data: users });
  } catch (e) {
    next(e);
  }
});

// Get a specific user
router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId);
    if (user == undefined) {
      return res
        .status(404)
        .json({ error: `User with id ${userId} does not exist!` });
    }
    return res.status(200).json({ data: user });
  } catch (e) {
    next(e);
  }
});

// Make a user
router.post("/", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (email == undefined) {
      return res.status(400).json({ error: "email is required!" });
    }
    const user = await db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(email);
    if (user) {
      return res.status(400).json({
        error: `User with email ${email} already exists!`,
      });
    }

    if (password == undefined) {
      return res.status(400).json({ error: "password is required!" });
    }
    const hashedPassword = await hashString(password, 12);
    const insertCommand = await db
      .prepare(`INSERT INTO users (email, password_hash) VALUES (?, ?)`)
      .run(email, hashedPassword);
    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

// Change password
router.patch("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { password } = req.body || {};

    const user = await db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId);
    if (user == undefined) {
      return res
        .status(404)
        .json({ error: `User with id ${userId} does not exist!` });
    }

    if (password == undefined) {
      return res.status(400).json({ error: "password is required!" });
    }
    const hashedPassword = await hashString(password, 12);
    const updateCommand = await db
      .prepare(
        `
        UPDATE users 
        SET password_hash = ?
        WHERE id = ?
      `,
      )
      .run(hashedPassword, userId);

    return res.status(200).json({ data: updateCommand });
  } catch (e) {
    next(e);
  }
});

// Authenticate a user
router.post("/auth", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (email == undefined) {
      return res.status(400).json({ error: "email is required!" });
    }
    if (password == undefined) {
      return res.status(400).json({ error: "password is required!" });
    }

    const user = await db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(email);
    if (user == undefined) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password!" });
    }

    return res
      .status(200)
      .json({ data: { success: true, id: user.id, email: user.email } });
  } catch (e) {
    next(e);
  }
});

// Delete a user
router.delete("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const deleteCommand = await db
      .prepare(`DELETE FROM users WHERE id = ?`)
      .run(userId);
    return res.status(200).json({ data: deleteCommand });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

export default router;
