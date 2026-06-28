import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// /api/session-exercises

router.get("/", async (req, res, next) => {
  try {
    const allSessionExercises = await db
      .prepare(`SELECT * FROM session_exercises`)
      .all();
    return res.status(200).json({ data: allSessionExercises });
  } catch (e) {
    next(e);
  }
});

// Create a session exercise
router.post("/", async (req, res, next) => {
  try {
    const { sessionId, exerciseId } = req.body || {};
    if (sessionId == undefined) {
      return res.status(400).json({ error: `sessionId is required!` });
    }
    if (exerciseId == undefined) {
      return res.status(400).json({ error: `exerciseId is required!` });
    }

    const session = await db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId);
    if (session == undefined) {
      return res
        .status(404)
        .json({ error: `Session with sessionId ${sessionId} does not exist!` });
    }

    const exercise = await db
      .prepare(`SELECT * FROM exercises WHERE id = ?`)
      .get(exerciseId);
    if (exercise == undefined) {
      return res.status(404).json({
        error: `Exercise with exerciseId ${exerciseId} does not exist! `,
      });
    }

    const sessionExercise = await db
      .prepare(
        `
      SELECT * FROM session_exercises 
      WHERE session_id = ? AND exercise_id = ?
      `,
      )
      .get(sessionId, exerciseId);
    if (sessionExercise != undefined) {
      return res.status(400).json({
        error: `Session Exercise with sessionId ${sessionId} and exerciseId ${exerciseId} already exists!`,
      });
    }

    const subquery = db
      .prepare(
        `SELECT MAX(order_index) AS max_order_index FROM session_exercises WHERE session_id = ?`,
      )
      .get(sessionId);
    const maxOrderIndex = subquery.max_order_index ?? 0;
    const insertCommand = db
      .prepare(
        `INSERT INTO session_exercises (session_id, exercise_id, order_index) VALUES (?, ?, ?)`,
      )
      .run(sessionId, exerciseId, maxOrderIndex + 1);

    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

export default router;
