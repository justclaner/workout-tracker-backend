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
    const exercises = await db.prepare("SELECT * FROM exercises;").all();
    return res.status(200).json({ data: exercises });
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
