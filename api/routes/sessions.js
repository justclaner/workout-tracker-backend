import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// /api/sessions

// Get all sessions, filter by userId possibly
router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const sessions = userId
      ? await db
          .prepare(
            `SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC;`,
          )
          .all(userId)
      : await db
          .prepare("SELECT * FROM sessions ORDER BY started_at DESC;")
          .all();
    return res.status(200).json({ data: sessions });
  } catch (e) {
    next(e);
  }
});

router.get("/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (session == undefined) {
      return res
        .status(404)
        .json({ error: `Session with id ${sessionId} does not exist!` });
    }
    return res.status(200).json({ data: session });
  } catch (e) {
    next(e);
  }
});

router.get("/:sessionId/full", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (session == undefined) {
      return res
        .status(404)
        .json({ error: `Session with id ${sessionId} does not exist!` });
    }

    const rows = await db
      .prepare(
        `
        SELECT
          se.id AS session_exercise_id,
          se.order_index,
          e.id AS exercise_id,
          e.name,
          e.body_part,
          e.equipment_type,
          s.id AS set_id,
          s.set_number,
          s.weight,
          s.reps,
          s.rpe,
          s.is_warmup
        FROM session_exercises se
        JOIN exercises e ON e.id = se.exercise_id
        LEFT JOIN sets s ON s.session_exercise_id = se.id
        WHERE se.session_id = ?
        ORDER BY se.order_index, s.set_number
      `,
      )
      .all(sessionId);

    // Group the rows into { session: session, exercises: [{ ...exercise, sets: [...]}]}
    const exerciseMap = new Map();
    for (const row of rows) {
      // A session can have multiple sets of the same session_exercise
      if (!exerciseMap.has(row.session_exercise_id)) {
        exerciseMap.set(row.session_exercise_id, {
          sessionExerciseId: row.session_exercise_id,
          orderIndex: row.order_index,
          exerciseId: row.exercise_id,
          name: row.name,
          bodyPart: row.body_part,
          equipmentType: row.equipment_type,
          sets: [],
        });
      }
      if (row.set_id != null) {
        exerciseMap.get(row.session_exercise_id).sets.push({
          id: row.set_id,
          setNumber: row.set_number,
          weight: row.weight,
          reps: row.reps,
          rpe: row.rpe,
          isWarmup: !!row.is_warmup, // converts 0 to false and 1 to true
        });
      }
    }
    return res.status(200).json({
      data: { session, exercises: [...exerciseMap.values()] },
    });
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
      VALUES (?, ?, ?)
      `,
      )
      .run(userId, name, notes);

    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

// Edit name and/or notes of a session
router.patch("/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { name, notes } = req.body || {};
    const session = await db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ error: `Session with sessionId ${sessionId} does not exist!` });
    }

    // Construct part of the MYSQL query
    let setLine = "";
    const args = [];

    if (name != undefined) {
      setLine += `name = ?`;
      args.push(name);
    }
    if (notes != undefined) {
      setLine += `${setLine.length > 0 ? ", " : ""}notes = ?`;
      args.push(notes);
    }

    if (setLine.length == 0) {
      return res.status(400).json({
        error: `At least one of name and notes is required!`,
      });
    }
    const updateCommand = await db
      .prepare(
        `
      UPDATE sessions 
      SET ${setLine} 
      WHERE id = ?;
      `,
      )
      .run(...args, sessionId);
    return res.status(200).json({ data: updateCommand });
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
