import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// GET /api/sessions

// Get all sessions
router.get("/", async (req, res, next) => {
  try {
    const sessions = await db.prepare("SELECT * FROM sessions;").all();
    return res.status(200).json({ data: sessions });
  } catch (e) {
    next(e);
  }
});

// Creates a new session, started_at will default to current time, ended_at should be NULL
router.post("/", async (req, res, next) => {
  try {
    // TIMESTAMP is in 'YYYY-MM-DD HH:MM:SS' format
    const { userId, name, notes = "" } = req.body || {};
    if (userId == undefined) {
      return res.status(400).json({ error: "userId is required!" });
    }
    const user = await db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId);
    if (user == undefined) {
      return res
        .status(404)
        .json({ error: `User with userId ${userId} does not exist!` });
    }

    if (name == undefined) {
      return res.status(400).json({ error: "name is required!" });
    }

    const insertCommand = await db
      .prepare(
        `
      INSERT INTO sessions (user_id, name, notes)
      VALUES (?, ?, ?, ?)
      `,
      )
      .run(userId, name, notes);

    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

// End a session
router.patch("/:sessionId/end", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ error: `Session with sessionId ${sessionId} does not exist!` });
    }
    const updateCommand = await db
      .prepare(`UPDATE sessions SET ended_at = datetime('now') WHERE id = ?`)
      .run(sessionId);
    return res.status(200).json({ data: updateCommand });
  } catch (e) {
    next(e);
  }
});

router.delete("/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleteCommand = db
      .prepare(`DELETE FROM sessions WHERE id = ?`)
      .run(sessionId);
    return res.status(200).json({ data: deleteCommand });
  } catch (e) {
    next(e);
  }
});

export default router;
