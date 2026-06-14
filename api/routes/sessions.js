import { Router } from "express";
const router = Router();

// GET /api/sessions
router.get("/", (req, res) => {
  res.json({ message: "sessions route" });
});

export default router;
