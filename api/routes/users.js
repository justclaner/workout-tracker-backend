import { Router } from "express";
import { hashString } from "../util/hash.js";
import db from "../../db/database.js";
const router = Router();

// GET /api/users
router.get("/", async (req, res, next) => {
  try {
    const users = await db.prepare("SELECT * FROM users;").all();
    return res.status(200).json({ data: users });
  } catch (e) {
    next(e);
  }
  res.json({ message: "users route" });
});

router.post("/", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "An email is required!" });
    }
    if (!password) {
      return res.status(400).json({ error: "A password is required!" });
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

router.delete("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const deleteCommand = await db
      .prepare(`DELETE FROM users WHERE id = ${userId}`)
      .run();
    return res.status(200).json({ data: deleteCommand });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

export default router;
