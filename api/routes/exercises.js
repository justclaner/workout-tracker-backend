import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// GET /api/exercises
router.get("/", async (req, res) => {
  try {
    const exercises = await db.prepare("SELECT * FROM exercises;").all();
    return res.status(200).json({ data: exercises });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

// router.post("/", async (req, res) => {
//   const {name, bodyPart, equipmentType, isCustom, userId} = req.body;
// });

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
