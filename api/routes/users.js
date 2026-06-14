import { Router } from "express";
const router = Router();

// GET /api/users
router.get("/", (req, res) => {
  res.json({ message: "users route" });
});

export default router;
