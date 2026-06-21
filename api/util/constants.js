// Global body parts
export const BODY_PARTS = new Set([
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
]);

// Global equipment types
export const EQUIPMENT_TYPES = new Set([
  "free_weight",
  "machine",
  "bodyweight",
  "cable",
]);

// Global exercise library with is_custom = false, user_id = null
export const GLOBAL_EXERCISES = [
  {
    name: "Barbell Bench Press",
    body_part: "chest",
    equipment_type: "free_weight",
  },
  {
    name: "Incline Dumbbell Press",
    body_part: "chest",
    equipment_type: "free_weight",
  },
  { name: "Push-Up", body_part: "chest", equipment_type: "bodyweight" },
  { name: "Cable Fly", body_part: "chest", equipment_type: "cable" },

  { name: "Pull-Up", body_part: "back", equipment_type: "bodyweight" },
  { name: "Barbell Row", body_part: "back", equipment_type: "free_weight" },
  { name: "Lat Pulldown", body_part: "back", equipment_type: "cable" },
  { name: "Seated Cable Row", body_part: "back", equipment_type: "cable" },

  { name: "Barbell Squat", body_part: "legs", equipment_type: "free_weight" },
  {
    name: "Romanian Deadlift",
    body_part: "legs",
    equipment_type: "free_weight",
  },
  { name: "Leg Press", body_part: "legs", equipment_type: "machine" },
  { name: "Walking Lunge", body_part: "legs", equipment_type: "bodyweight" },
  { name: "Leg Curl", body_part: "legs", equipment_type: "machine" },

  {
    name: "Overhead Press",
    body_part: "shoulders",
    equipment_type: "free_weight",
  },
  {
    name: "Lateral Raise",
    body_part: "shoulders",
    equipment_type: "free_weight",
  },
  { name: "Face Pull", body_part: "shoulders", equipment_type: "cable" },

  { name: "Barbell Curl", body_part: "arms", equipment_type: "free_weight" },
  { name: "Tricep Pushdown", body_part: "arms", equipment_type: "cable" },
  { name: "Dip", body_part: "arms", equipment_type: "bodyweight" },

  { name: "Plank", body_part: "core", equipment_type: "bodyweight" },
  {
    name: "Hanging Leg Raise",
    body_part: "core",
    equipment_type: "bodyweight",
  },
];
