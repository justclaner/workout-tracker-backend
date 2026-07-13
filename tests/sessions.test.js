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

describe("POST /api/sessions/", () => {
  it("no user id returns 400", async () => {
    const res = await request(app).post("/api/sessions").send({
      name: "random name",
      notes: "random notes",
    });
    expect(res.status).toBe(400);
  });

  it("user not existing returns 404", async () => {
    const res = await request(app).post("/api/sessions").send({
      userId: 1,
      name: "random name",
      notes: "random notes",
    });
    expect(res.status).toBe(404);
  });

  it("no name returns 400", async () => {
    const userId = await createTestUser();
    const res = await request(app).post("/api/sessions").send({
      userId: userId,
      notes: "random notes",
    });
    expect(res.status).toBe(400);
  });

  it("session is created successfully with all parameters", async () => {
    const userId = await createTestUser();
    const res = await request(app).post("/api/sessions").send({
      userId: userId,
      name: "random name",
      notes: "random notes",
    });
    expect(res.status).toBe(201);
  });

  it("session is created successfully without providing notes", async () => {
    const userId = await createTestUser();
    const res = await request(app).post("/api/sessions").send({
      userId: userId,
      name: "random name",
    });
    expect(res.status).toBe(201);
  });
});

describe("PATCH /api/sessions/:sessionId", () => {
  it("session not existing returns 404", async () => {
    const res = await request(app).patch("/api/sessions/1").send({});
    expect(res.status).toBe(404);
  });

  it("no name and no notes returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const res = await request(app).patch(`/api/sessions/${sessionId}`).send({});
    expect(res.status).toBe(400);
  });

  it("giving name updates name", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const res = await request(app).patch(`/api/sessions/${sessionId}`).send({
      name: "abcdef1234",
    });
    expect(res.status).toBe(200);

    const session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.body.data.name).toBe("abcdef1234");
  });

  it("giving notes updates notes", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const res = await request(app).patch(`/api/sessions/${sessionId}`).send({
      notes: "abcdef1234",
    });
    expect(res.status).toBe(200);

    const session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.body.data.notes).toBe("abcdef1234");
  });

  it("giving name and notes updates both", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const res = await request(app).patch(`/api/sessions/${sessionId}`).send({
      name: "qwerty9876",
      notes: "abcdef1234",
    });
    expect(res.status).toBe(200);

    const session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.body.data.name).toBe("qwerty9876");
    expect(session.body.data.notes).toBe("abcdef1234");
  });
});

describe("PATCH /api/sessions/:sessionId/end", () => {
  it("session not existing returns 404", async () => {
    const res = await request(app).patch("/api/sessions/1/end").send({});
    expect(res.status).toBe(404);
  });

  it("ended_at is successfully updated", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    let session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.status).toBe(200);
    expect(session.body.data.ended_at).toBeNull();

    const res = await request(app).patch(`/api/sessions/${sessionId}/end`);
    expect(res.status).toBe(200);
    session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.status).toBe(200);
    expect(session.body.data.ended_at).not.toBeNull();
  });
});

describe("DELETE /api/sessions/:sessionId", () => {
  it("session not existing returns 200", async () => {
    const res = await request(app).delete("/api/sessions/1");
    expect(res.status).toBe(200);
  });

  it("session is successfully deleted", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const res = await request(app).delete(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(200);

    const session = await request(app).get(`/api/sessions/${sessionId}`);
    expect(session.status).toBe(404);
  });
});
