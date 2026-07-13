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

describe("GET /api/session-exercises", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/session-exercises");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/session-exercises/:sessionExerciseId", () => {
  it("no session exercise returns 404", async () => {
    const res = await request(app).get("/api/session-exercises/1");
    expect(res.status).toBe(404);
  });

  it("session exercises are returned", async () => {
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

    const res1 = await request(app).get(
      `/api/session-exercises/${sessionExerciseId1}`,
    );
    expect(res1.status).toBe(200);
    expect(res1.body.data.session_id).toBe(sessionId);
    expect(res1.body.data.exercise_id).toBe(globalExerciseId);

    const res2 = await request(app).get(
      `/api/session-exercises/${sessionExerciseId2}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data.session_id).toBe(sessionId);
    expect(res2.body.data.exercise_id).toBe(customExerciseId);
  });
});

describe("POST /api/session-exercises", () => {
  it("no session id returns 400", async () => {
    const userId = await createTestUser();
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app).post(`/api/session-exercises`).send({
      exerciseId: customExerciseId,
    });
    expect(res.status).toBe(400);
  });

  it("no exercise id returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);

    const res = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
    });
    expect(res.status).toBe(400);
  });

  it("session exercise is successfully created", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);

    const res = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
      exerciseId: customExerciseId,
    });
    expect(res.status).toBe(201);
  });

  it("recreating an existing session exercise returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);

    const res1 = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
      exerciseId: customExerciseId,
    });
    expect(res1.status).toBe(201);

    const res2 = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
      exerciseId: customExerciseId,
    });
    expect(res2.status).toBe(400);
  });

  it("session exercise order index increases for the same session", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const globalExerciseId = await createTestGlobalExercise("Barbell Squat");
    const customExerciseId = await createTestExercise(userId);

    const res1 = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
      exerciseId: globalExerciseId,
    });
    expect(res1.status).toBe(201);
    const sessionExerciseId1 = res1.body.data.lastInsertRowid;

    const res2 = await request(app).post(`/api/session-exercises`).send({
      sessionId: sessionId,
      exerciseId: customExerciseId,
    });
    expect(res2.status).toBe(201);
    const sessionExerciseId2 = res2.body.data.lastInsertRowid;

    const res3 = await request(app).get(
      `/api/session-exercises/${sessionExerciseId1}`,
    );
    expect(res3.status).toBe(200);

    const res4 = await request(app).get(
      `/api/session-exercises/${sessionExerciseId2}`,
    );
    expect(res4.status).toBe(200);

    const firstOrderIndex = res3.body.data.order_index;
    const secondOrderIndex = res4.body.data.order_index;
    expect(secondOrderIndex).toBeGreaterThan(firstOrderIndex);
  });
});

describe("PATCH /api/session-exercises/:sessionExerciseId", () => {
  it("session exercise not existing returns 404", async () => {
    const res = await request(app).patch(`/api/session-exercises/1`).send({});
    expect(res.status).toBe(404);
  });

  it("no order index returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app)
      .patch(`/api/session-exercises/${sessionExerciseId}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("order index is successfully changed", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    let sessionExercise = await request(app).get(
      `/api/session-exercises/${sessionExerciseId}`,
    );
    expect(sessionExercise.status).toBe(200);

    const order_index = sessionExercise.body.data.order_index;
    const res = await request(app)
      .patch(`/api/session-exercises/${sessionExerciseId}`)
      .send({
        orderIndex: order_index + 1234,
      });
    expect(res.status).toBe(200);

    sessionExercise = await request(app).get(
      `/api/session-exercises/${sessionExerciseId}`,
    );
    expect(sessionExercise.status).toBe(200);
    expect(sessionExercise.body.data.order_index).toBe(order_index + 1234);
  });
});

describe("DELETE /api/session-exercises/:sessionExerciseId", () => {
  it("session exercise not existing returns 200", async () => {
    const res = await request(app).delete(`/api/session-exercises/1`);
    expect(res.status).toBe(200);
  });

  it("session exercise is successfully deleted", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).delete(
      `/api/session-exercises/${sessionExerciseId}`,
    );
    expect(res.status).toBe(200);

    const sessionExercise = await request(app).get(
      `/api/session-exercises/${sessionExerciseId}`,
    );
    expect(sessionExercise.status).toBe(404);
  });
});
