import db from "./database.js";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Clearing existing data...");
  db.exec(`
    DELETE FROM sets;
    DELETE FROM session_exercises;
    DELETE FROM sessions;
    DELETE FROM exercises;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'exercises', 'sessions', 'session_exercises', 'sets');
  `);

  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("password123", 12);
  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
  );
  const user = insertUser.run("test@example.com", passwordHash);
  const userId = user.lastInsertRowid;

  console.log("Seeding exercises...");
  const insertExercise = db.prepare(`
    INSERT INTO exercises (name, body_part, equipment_type, is_custom, user_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const benchPress = insertExercise.run(
    "Bench Press",
    "chest",
    "free_weight",
    0,
    null,
  );
  const squat = insertExercise.run("Squat", "legs", "free_weight", 0, null);
  const customCurl = insertExercise.run(
    "Cable Curl Variant",
    "arms",
    "cable",
    1,
    userId,
  );

  console.log("Seeding a session...");
  const insertSession = db.prepare(`
    INSERT INTO sessions (user_id, name, started_at, ended_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  const session = insertSession.run(userId, "Push Day");
  const sessionId = session.lastInsertRowid;

  console.log("Linking exercises to session...");
  const insertSessionExercise = db.prepare(`
    INSERT INTO session_exercises (session_id, exercise_id, order_index)
    VALUES (?, ?, ?)
  `);
  const se1 = insertSessionExercise.run(
    sessionId,
    benchPress.lastInsertRowid,
    1,
  );
  const se2 = insertSessionExercise.run(sessionId, squat.lastInsertRowid, 2);

  console.log("Seeding sets...");
  const insertSet = db.prepare(`
    INSERT INTO sets (session_exercise_id, set_number, weight, reps, rpe, is_warmup)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSet.run(se1.lastInsertRowid, 1, 135, 10, 6.0, 1);
  insertSet.run(se1.lastInsertRowid, 2, 185, 8, 8.5, 0);
  insertSet.run(se2.lastInsertRowid, 1, 225, 5, 7.0, 0);

  console.log("Seed complete.");
  console.log(`Test login -> email: test@example.com, password: password123`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
