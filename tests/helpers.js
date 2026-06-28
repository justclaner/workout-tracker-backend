import request from "supertest";
import app from "../api/app.js";
import {
  BODY_PARTS,
  EQUIPMENT_TYPES,
  GLOBAL_EXERCISES,
} from "../api/util/constants.js";

let userCounter = 0;
let exerciseCounter = 0;
let sessionCounter = 0;
let sessionExerciseCounter = 0;

const BODY_PARTS_ARR = [...BODY_PARTS];
const EQUIPMENT_TYPES_ARR = [...EQUIPMENT_TYPES];

export const generateRandomString = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Returns random integer between min and max inclusive. Returns 1 if min > max
export const randomNumber = (min, max) => {
  return min <= max ? Math.floor(Math.random() * (max - min + 1) + min) : 1;
};

export const createTestUser = async () => {
  userCounter++;
  const res = await request(app)
    .post("/api/users")
    .send({
      email: `user${userCounter}@example.com`,
      password: `password${userCounter}`,
    });
  return res.body.data.lastInsertRowid;
};

export const createTestExercise = async (userId, overrides = {}) => {
  exerciseCounter++;
  const res = await request(app)
    .post("/api/exercises")
    .send({
      name: `exercise${exerciseCounter}`,
      bodyPart: BODY_PARTS_ARR[exerciseCounter % BODY_PARTS_ARR.length],
      equipmentType:
        EQUIPMENT_TYPES_ARR[exerciseCounter % EQUIPMENT_TYPES_ARR.length],
      isCustom: true,
      userId,
      notes: generateRandomString(),
      ...overrides,
    });
  return res.body.data.lastInsertRowid;
};

export const initializeGlobalExercises = async () => {
  for (let i = 0; i < GLOBAL_EXERCISES.length; i++) {
    const { name, body_part, equipment_type } = GLOBAL_EXERCISES_ARR[i];

    await request(app).post("/api/exercises").send({
      name,
      bodyPart: body_part,
      equipmentType: equipment_type,
      isCustom: false,
      userId: null,
    });

    if (res.status != 200) {
      throw new Error(
        `Failed to create global exercise "${name}": ${res.body.error}`,
      );
    }
  }
};

export const createTestSession = async (userId, overrides = {}) => {
  sessionCounter++;
  const res = await request(app)
    .post("/api/sessions")
    .send({
      userId,
      name: `session${sessionCounter}`,
      notes: generateRandomString(),
      ...overrides,
    });
  return res.body.data.lastInsertRowid;
};

export const createTestSessionExercise = async (
  sessionId,
  exerciseId,
  overrides = {},
) => {
  sessionExerciseCounter++;
  const res = await request(app)
    .post(`/api/sessions/${sessionId}/${exerciseId}`)
    .send({
      ...overrides,
    });
  return res.body.data.lastInsertRowid;
};
