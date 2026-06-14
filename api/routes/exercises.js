import { Router } from "express";
const router = Router();

// GET /api/exercises
router.get("/", (req, res) => {
  res.json({ message: "exercises route" });
});

export default router;
