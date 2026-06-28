import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// /api/sets

router.get("/", async (req, res, next) => {
  try {
    const allSets = await db.prepare(`SELECT * FROM sets`).all();
    return res.status(200).json({ data: allSets });
  } catch (e) {
    next(e);
  }
});

router.get("/:setId", async (req, res, next) => {
  try {
    const { setId } = req.params;
    const set = await db.prepare(`SELECT * FROM sets WHERE id = ?`).get(setId);
    if (set == undefined) {
      return res
        .status(404)
        .json({ error: `Set with id ${setId} does not exist!` });
    }
    return res.status(200).json({ data: set });
  } catch (e) {
    next(e);
  }
});

router.post("/:sessionExerciseId", async (req, res, next) => {
  try {
    const { sessionExerciseId } = req.params;
    const { weight, reps, rpe, isWarmup = false } = req.body || {};

    if (weight == undefined) {
      return res.status(400).json({ error: `weight is required!` });
    }
    if (reps == undefined) {
      return res.status(400).json({ error: `reps is required!` });
    }
    if (rpe == undefined) {
      return res.status(400).json({ error: `rpe is required!` });
    }
    if (isWarmup && typeof isWarmup != "boolean") {
      return res
        .status(400)
        .json({ error: `isWarmup ${isWarmup} is not a boolean!` });
    }
    const isWarmupValue = isWarmup ? 1 : 0;

    const sessionExercise = await db
      .prepare(`SELECT * FROM session_exercises WHERE id = ?`)
      .get(sessionExerciseId);
    if (sessionExercise == undefined) {
      return res.status(404).json({
        error: `Session Exercise with id ${sessionExerciseId} does not exist!`,
      });
    }

    const subquery = await db
      .prepare(
        `SELECT MAX(set_number) AS max_set_number FROM sets WHERE session_exercise_id = ?`,
      )
      .get(sessionExerciseId);
    const maxSetNumber = subquery.max_set_number ?? 0;

    const insertCommand = await db
      .prepare(
        `
			INSERT INTO sets (session_exercise_id, set_number, weight, reps, rpe, is_warmup)
			VALUES (?, ?, ?, ?, ?, ?)
			`,
      )
      .run(
        sessionExerciseId,
        maxSetNumber + 1,
        weight,
        reps,
        rpe,
        isWarmupValue,
      );
    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

router.delete("/:setId", async (req, res, next) => {
  try {
    const { setId } = req.params;
    const deleteCommand = await db
      .prepare(`DELETE FROM sets WHERE id = ?`)
      .run(setId);
    return res.status(200).json({ data: deleteCommand });
  } catch (e) {
    next(e);
  }
});

export default router;
