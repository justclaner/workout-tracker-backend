import express from "express";
import "dotenv/config";
import cors from "cors";
import db from "../db/database.js";

import userRoutes from "./routes/users.js";
import sessionRoutes from "./routes/sessions.js";
import exerciseRoutes from "./routes/exercises.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/exercises", exerciseRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
