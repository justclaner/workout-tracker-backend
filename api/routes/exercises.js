import { Router } from "express";
import db from "../../db/database.js";
import {
  BODY_PARTS,
  EQUIPMENT_TYPES,
  GLOBAL_EXERCISES,
} from "../util/constants.js";
const router = Router();

// GET /api/exercises
router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const exercises = userId
      ? await db
          .prepare(`SELECT * FROM exercises WHERE user_id = ?;`)
          .all(userId)
      : await db.prepare(`SELECT * FROM exercises;`).all();
    return res.status(200).json({ data: exercises });
  } catch (e) {
    next(e);
  }
});

router.get("/:exerciseId", async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const exercise = await db
      .prepare(`SELECT * FROM exercises WHERE id = ?`)
      .get(exerciseId);
    if (exercise == undefined) {
      return res
        .status(404)
        .json({ error: `Exercise with id ${exerciseId} does not exist!` });
    }
    return res.status(200).json({ data: exercise });
  } catch (e) {
    next(e);
  }
});

// Get a history of what user has done with this exercise
router.get("/:exerciseId/history", async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const { userId } = req.query;

    const exercise = await db
      .prepare(`SELECT * FROM exercises WHERE id = ?`)
      .get(exerciseId);
    if (exercise == undefined) {
      return res
        .status(404)
        .json({ error: `Exercise with id ${exerciseId} does not exist!` });
    }

    if (userId == undefined) {
      return res.status(400).json({ error: `userId is required!` });
    }

    const user = await db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId);
    if (user == undefined) {
      return res
        .status(404)
        .json({ error: `User with id ${userId} does not exist!` });
    }

    const history = await db
      .prepare(
        `
      SELECT 
        sess.id AS session_id, 
        sess.name AS session_name,
        sess.notes AS session_notes,
        sess.started_at AS started_at,
        sess.ended_at AS ended_at,
        s.set_number AS set_number,
        s.weight AS weight,
        s.reps AS reps,
        s.rpe AS rpe,
        s.is_warmup AS is_warmup 
      FROM sets s JOIN session_exercises se ON s.session_exercise_id = se.id 
      JOIN sessions sess ON se.session_id = sess.id 
      WHERE se.exercise_id = ? AND sess.user_id = ? 
      ORDER BY sess.started_at ASC; 
      `,
      )
      .all(exerciseId, userId);

    return res.status(200).json({ data: history });
  } catch (e) {
    next(e);
  }
});

// Makes exercise
router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      bodyPart,
      equipmentType,
      isCustom = false,
      userId = null,
      notes = "",
    } = req.body || {};

    if (userId != null) {
      const user = await db
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .get(userId);
      if (user == undefined) {
        return res
          .status(404)
          .json({ error: `User with userId ${userId} does not exist!` });
      }
    }

    if (name == undefined) {
      return res.status(400).json({ error: "name is required!" });
    }

    if (
      userId == null &&
      GLOBAL_EXERCISES.find((exercise) => exercise.name == name) == undefined
    ) {
      return res
        .status(400)
        .json({ error: "Global exercise with invalid name!" });
    }

    if (bodyPart == undefined) {
      return res.status(400).json({ error: "bodyPart is required!" });
    }
    if (!BODY_PARTS.has(bodyPart)) {
      return res
        .status(400)
        .json({ error: `bodyPart ${bodyPart} is not a valid body part!` });
    }

    if (equipmentType == undefined) {
      return res.status(400).json({ error: "equipmentType is required!" });
    }
    if (!EQUIPMENT_TYPES.has(equipmentType)) {
      return res.status(400).json({
        error: `equipmentType ${equipmentType} is not a valid equipment type!`,
      });
    }

    if (isCustom && typeof isCustom != "boolean") {
      return res
        .status(400)
        .json({ error: `isCustom ${isCustom} is not a boolean!` });
    }

    const isCustomValue = isCustom ? 1 : 0;

    const insertCommand = db
      .prepare(
        `
      INSERT INTO exercises (name, body_part, equipment_type, is_custom, user_id, notes) 
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(name, bodyPart, equipmentType, isCustomValue, userId, notes);

    return res.status(201).json({ data: insertCommand });
  } catch (e) {
    next(e);
  }
});

// Edit a user-made custom exercise
router.patch("/:exerciseId", async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const { name, bodyPart, equipmentType, notes } = req.body || {};
    const exercise = await db
      .prepare(`SELECT * FROM exercises WHERE id = ?`)
      .get(exerciseId);
    if (exercise == undefined) {
      return res
        .status(404)
        .json({ error: `Exercise with id ${exerciseId} does not exist!` });
    }
    if (!exercise.isCustom || exercise.user_id != null) {
      return res.status(400).json({
        error: `A global exercise can not be edited!`,
      });
    }

    let setLine = "";
    const args = [];

    if (name != undefined) {
      setLine += "name = ?";
      args.push(name);
    }
    if (bodyPart != undefined) {
      if (!BODY_PARTS.has(bodyPart)) {
        return res
          .status(400)
          .json({ error: `bodyPart ${bodyPart} is not a valid body part!` });
      }
      setLine += `${setLine.length > 0 ? ", " : ""}body_part = ?`;
      args.push(bodyPart);
    }
    if (equipmentType != undefined) {
      if (!EQUIPMENT_TYPES.has(equipmentType)) {
        return res.status(400).json({
          error: `equipmentType ${equipmentType} is not a valid equipment type!`,
        });
      }
      setLine += `${setLine.length > 0 ? ", " : ""}equipment_type = ?`;
      args.push(equipmentType);
    }
    if (notes != undefined) {
      setLine += `${setLine.length > 0 ? ", " : ""}notes = ?`;
      args.push(notes);
    }

    if (setLine.length == 0) {
      return res.status(400).json({
        error: `At least one of name, bodyPart, equipmentType, and notes is required!`,
      });
    }

    const updateCommand = await db
      .prepare(
        `
      UPDATE exercises 
      SET ${setLine} 
      WHERE id = ?;
    `,
      )
      .run(...args, exerciseId);

    return res.status(200).json({ data: updateCommand });
  } catch (e) {
    next(e);
  }
});

router.delete("/:exerciseId", async (req, res, next) => {
  try {
    const { exerciseId } = req.params;
    const deleteCommand = db
      .prepare(`DELETE FROM exercises WHERE id = ?`)
      .run(exerciseId);
    return res.status(200).json({ data: deleteCommand });
  } catch (e) {
    next(e);
  }
});

export default router;
// When using SQLite
// router.get("/", async (req, res, next) => {
//   try {
//     const exercises = db.prepare("SELECT * FROM exercises").all();
//     res.json(exercises);
//   } catch (err) {
//     next(err);
//   }
// });

// When using MySQL
// router.get("/", async (req, res, next) => {
//   try {
//     const [exercises] = await db.query("SELECT * FROM exercises");
//     res.json(exercises);
//   } catch (err) {
//     next(err);
//   }
// });
