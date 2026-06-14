import { Router } from "express";
const router = Router();

// GET /api/exercises
router.get("/", (req, res) => {
  res.json({ message: "exercises route" });
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
