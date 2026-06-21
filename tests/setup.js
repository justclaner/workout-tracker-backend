import db from "../db/database.js";
import { beforeEach } from "vitest";

process.env.NODE_ENV = "test";

beforeEach(() => {
  console.log("Clearing tables...");
  db.exec(`
    DELETE FROM sets;
    DELETE FROM session_exercises;
    DELETE FROM sessions;
    DELETE FROM exercises;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);
});
