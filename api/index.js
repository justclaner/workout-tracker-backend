import app from "./app.js";

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});

// NOTES for migrating to MySQL (possibly mysql2)
// basic exercise route
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

// extra data fields
// change all occurrences of lastInsertRowid to insertId
// change all occurrences of changes to affectedRows
