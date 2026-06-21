import { Router } from "express";
import db from "../../db/database.js";
const router = Router();

// GET /api/sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await db.prepare("SELECT * FROM sessions;").all();
    return res.status(200).json({ data: sessions });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

export default router;
