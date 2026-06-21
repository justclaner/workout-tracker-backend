import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// GET /api/sessions
router.get("/", (req, res) => {
  res.json({ message: "sessions route" });
});

export default router;
