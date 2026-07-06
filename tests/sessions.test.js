import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

import {
  createTestUser,
  createTestGlobalExercise,
  createTestExercise,
  createTestSession,
  createTestSessionExercise,
  createTestSet,
} from "./helpers.js";

describe("GET /api/sessions", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/sessions/:sessionId", () => {
  it("session that exists is retrieved", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);

    const res = await request(app).get(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(200);
  });

  it("session that does not exist is not retrieved", async () => {
    const res = await request(app).get(`/api/sessions/1`);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/sessions/:sessionId/full", () => {
  it("session that does not exist is not retrieved", async () => {
    const res = await request(app).get(`/api/sessions/1/full`);
    expect(res.status).toBe(404);
  });

  it("session with no exercises returns empty exercises array", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);

    const res = await request(app).get(`/api/sessions/${sessionId}/full`);
    expect(res.status).toBe(200);
    expect(res.body.data.session).toMatchObject({
      id: sessionId,
      user_id: userId,
    });
    expect(res.body.data.exercises).toEqual([]);
  });

  it("session with exercises returns correctly structured JSON", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const globalExerciseId = await createTestGlobalExercise("Barbell Squat"); // must match a name in GLOBAL_EXERCISES
    const customExerciseId = await createTestExercise(userId);

    const sessionExerciseId1 = await createTestSessionExercise(
      sessionId,
      globalExerciseId,
    );
    const sessionExerciseId2 = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    for (let i = 0; i < 10; i++) {
      await createTestSet(sessionExerciseId1);
      await createTestSet(sessionExerciseId2);
    }

    const res = await request(app).get(`/api/sessions/${sessionId}/full`);

    expect(res.status).toBe(200);
    expect(res.body.data.session).toMatchObject({
      id: sessionId,
      user_id: userId,
    });
    expect(res.body.data.exercises).toHaveLength(2);
    const exercises = res.body.data.exercises;
    for (let i = 0; i < exercises.length; i++) {
      expect(exercises[i].sets).toHaveLength(10);
      expect([sessionExerciseId1, sessionExerciseId2]).toContain(
        exercises[i].sessionExerciseId,
      );
      for (const set of exercises[i].sets) {
        expect(set).toMatchObject({
          setNumber: expect.any(Number),
          weight: expect.any(Number),
          reps: expect.any(Number),
          rpe: expect.any(Number),
          isWarmup: expect.any(Boolean),
        });
      }
    }
  });
});
