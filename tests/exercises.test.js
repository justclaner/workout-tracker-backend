import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

import {
  createTestUser,
  createTestExercise,
  createTestGlobalExercise,
  createTestSession,
  createTestSessionExercise,
  createTestSet,
} from "./helpers.js";
import { GLOBAL_EXERCISES } from "../api/util/constants.js";

import { generateRandomString } from "./helpers.js";

const GLOBAL_EXERCISES_ARR = [...GLOBAL_EXERCISES];

describe("GET /api/exercises", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/exercises");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/exercises/:exerciseId", () => {
  it("exercise not existing returns 404", async () => {
    const res = await request(app).get("/api/exercises/1");
    expect(res.status).toBe(404);
  });

  it("existing exercise is returned with the correct structure", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app).get(`/api/exercises/${customExerciseId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      body_part: expect.any(String),
      equipment_type: expect.any(String),
      is_custom: expect.toSatisfy((val) => val === 0 || val === 1),
      user_id: expect.any(Number),
      notes: expect.any(String),
    });
  });
});

describe("GET /api/exercises/:exerciseId/history", () => {
  it("exercise not existing returns 404", async () => {
    const res = await request(app).get("/api/exercises/1/history");
    expect(res.status).toBe(404);
  });

  it("no user id returns 400", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app).get(
      `/api/exercises/${customExerciseId}/history`,
    );
    expect(res.status).toBe(400);
  });

  it("incorrect/invalid user id returns 404", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app).get(
      `/api/exercises/${customExerciseId}/history?userId=${userId + 1}`,
    );
    expect(res.status).toBe(404);
  });

  it("successfully returns a history of sessions and sets", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const sessionCount = 5;
    const setsPerSession = 6;
    for (let i = 0; i < sessionCount; i++) {
      const sessionId = await createTestSession(userId);
      const sessionExerciseId = await createTestSessionExercise(
        sessionId,
        customExerciseId,
      );
      for (let j = 0; j < setsPerSession; j++) {
        const setId = await createTestSet(sessionExerciseId, {
          isWarmup: j % 2 == 0,
        });
      }
      if (i % 2 != 0) {
        await request(app).patch(`/api/sessions/${sessionId}/end`);
      }
    }

    const res = await request(app).get(
      `/api/exercises/${customExerciseId}/history?userId=${userId}`,
    );
    expect(res.status).toBe(200);

    const history = res.body.data;
    expect(history.length).toBe(sessionCount * setsPerSession);
    for (let i = 0; i < history.length; i++) {
      expect(history[i]).toMatchObject({
        session_id: expect.any(Number),
        session_name: expect.any(String),
        session_notes: expect.any(String),
        started_at: expect.any(String),
        ended_at: expect.toSatisfy(
          (val) => val == null || typeof val === "string",
        ),
        set_number: expect.any(Number),
        weight: expect.any(Number),
        reps: expect.any(Number),
        rpe: expect.any(Number),
        is_warmup: expect.toBeOneOf([0, 1]),
      });
    }
  });
});

describe("POST /api/exercises", () => {
  it("creates a custom exercise for a valid user", async () => {
    const userId = await createTestUser();

    const res = await request(app).post("/api/exercises").send({
      name: "Cable Curl Variant",
      bodyPart: "arms",
      equipmentType: "cable",
      userId,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.lastInsertRowid).toBeDefined();
  });

  it("rejects an invalid bodyPart", async () => {
    const userId = await createTestUser();

    const res = await request(app).post("/api/exercises").send({
      name: "Made Up Exercise",
      bodyPart: "not_a_real_part",
      equipmentType: "cable",
      userId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/body part/i);
  });

  it("rejects an invalid equipmentType", async () => {
    const userId = await createTestUser();

    const res = await request(app).post("/api/exercises").send({
      name: "Made Up Exercise",
      bodyPart: "arms",
      equipmentType: "not_real",
      userId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/equipment type/i);
  });

  it("rejects a nonexistent userId", async () => {
    const res = await request(app).post("/api/exercises").send({
      name: "Made Up Exercise",
      bodyPart: "arms",
      equipmentType: "cable",
      userId: 99999,
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/does not exist/i);
  });

  it("accepts a null userId with valid global exercise", async () => {
    const { name, body_part, equipment_type } = GLOBAL_EXERCISES_ARR[0];
    const res = await request(app).post("/api/exercises").send({
      name,
      bodyPart: body_part,
      equipmentType: equipment_type,
      userId: null,
    });

    expect(res.status).toBe(201);
  });

  it("rejects a null userId with invalid body part", async () => {
    const { body_part, equipment_type } = GLOBAL_EXERCISES_ARR[0];
    const res = await request(app).post("/api/exercises").send({
      name: "asdlfjas;dlfja",
      bodyPart: body_part,
      equipmentType: equipment_type,
      userId: null,
    });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/exercises", () => {
  it("exercise not existing returns 404", async () => {
    const res = await request(app).patch(`/api/exercises/1`).send({});
    expect(res.status).toBe(404);
  });

  it("global exercise given returns 400", async () => {
    const userId = await createTestUser();
    const globalExerciseId = await createTestGlobalExercise("Barbell Squat");

    const res = await request(app)
      .patch(`/api/exercises/${globalExerciseId}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("no name and bodyPart and equipmentType and notes returns 400", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app)
      .patch(`/api/exercises/${customExerciseId}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/exercises/:exerciseId", () => {
  it("deletes an exercise", async () => {
    const userId = await createTestUser();

    const createRes = await request(app).post("/api/exercises").send({
      name: "Temp Exercise",
      bodyPart: "core",
      equipmentType: "bodyweight",
      userId,
    });

    const exerciseId = createRes.body.data.lastInsertRowid;

    const res = await request(app).delete(`/api/exercises/${exerciseId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.changes).toBe(1);
  });
});
