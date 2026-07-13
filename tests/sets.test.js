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

describe("GET /api/sets", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/sets");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/sets/:setId", () => {
  it("set not existing returns 404", async () => {
    const res = await request(app).get(`/api/sets/1`);
    console.log(res);
    expect(res.status).toBe(404);
  });

  it("existing set is returned with the correct structure", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).get(`/api/sets/${setId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      session_exercise_id: expect.any(Number),
      set_number: expect.any(Number),
      weight: expect.any(Number),
      reps: expect.any(Number),
      rpe: expect.any(Number),
      is_warmup: expect.toSatisfy((val) => val === 0 || val === 1),
    });
  });
});

describe("POST /api/sets/:sessionExerciseId", () => {
  it("session exercise not existing returns 404", async () => {
    const res = await request(app).post(`/api/sets/1`);
    expect(res.status).toBe(404);
  });

  it("no weight returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      reps: 10,
      rpe: 8,
      isWarmup: false,
    });
    expect(res.status).toBe(400);
  });

  it("no reps returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      weight: 180,
      rpe: 8,
      isWarmup: false,
    });
    expect(res.status).toBe(400);
  });

  it("no rpe returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      weight: 180,
      reps: 12,
      isWarmup: false,
    });
    expect(res.status).toBe(400);
  });

  it("no isWarmup returns 200", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      weight: 180,
      reps: 12,
      rpe: 8,
    });
    expect(res.status).toBe(201);

    const setId = res.body.data.lastInsertRowid;
    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(0);
  });

  it("non-boolean isWarmup returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      weight: 180,
      reps: 12,
      rpe: 8,
      isWarmup: 1234,
    });
    expect(res.status).toBe(400);
  });

  it("set is successfully created", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res = await request(app).post(`/api/sets/${sessionExerciseId}`).send({
      weight: 180,
      reps: 12,
      rpe: 8,
      isWarmup: true,
    });
    expect(res.status).toBe(201);
  });

  it("recreating a set with the same session exercise increases set number", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res1 = await request(app)
      .post(`/api/sets/${sessionExerciseId}`)
      .send({
        weight: 180,
        reps: 12,
        rpe: 8,
      });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post(`/api/sets/${sessionExerciseId}`)
      .send({
        weight: 180,
        reps: 12,
        rpe: 8,
      });
    expect(res2.status).toBe(201);

    const setId1 = res1.body.data.lastInsertRowid;
    const setId2 = res2.body.data.lastInsertRowid;

    const set1 = await request(app).get(`/api/sets/${setId1}`);
    expect(set1.status).toBe(200);

    const set2 = await request(app).get(`/api/sets/${setId2}`);
    expect(set2.status).toBe(200);

    const firstSetNumber = set1.body.data.set_number;
    const secondSetNumber = set2.body.data.set_number;
    expect(secondSetNumber).toBeGreaterThan(firstSetNumber);
  });

  it("recreating a set with a different session exercise has a set number of 1", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const globalExerciseId = await createTestGlobalExercise("Barbell Squat");
    const customExerciseId = await createTestExercise(userId);

    const sessionExerciseId1 = await createTestSessionExercise(
      sessionId,
      globalExerciseId,
    );
    const sessionExerciseId2 = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );

    const res1 = await request(app)
      .post(`/api/sets/${sessionExerciseId1}`)
      .send({
        weight: 180,
        reps: 12,
        rpe: 8,
      });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post(`/api/sets/${sessionExerciseId2}`)
      .send({
        weight: 180,
        reps: 12,
        rpe: 8,
      });
    expect(res2.status).toBe(201);

    const setId1 = res1.body.data.lastInsertRowid;
    const setId2 = res2.body.data.lastInsertRowid;

    const set1 = await request(app).get(`/api/sets/${setId1}`);
    expect(set1.status).toBe(200);

    const set2 = await request(app).get(`/api/sets/${setId2}`);
    expect(set2.status).toBe(200);

    const firstSetNumber = set1.body.data.set_number;
    const secondSetNumber = set2.body.data.set_number;
    expect(firstSetNumber).toBe(1);
    expect(secondSetNumber).toBe(1);
    expect(secondSetNumber).toBe(firstSetNumber);
  });
});

describe("PATCH /api/sets/:setId", () => {
  it("set not existing returns 404", async () => {
    const res = await request(app).patch(`/api/sets/1`).send({});
    expect(res.status).toBe(404);
  });

  it("no weight and reps and rpe and isWarmup returns 400", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({});
    expect(res.status).toBe(400);
  });

  it("weight is successfully updated", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
  });

  it("reps is successfully updated", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      reps: 1234,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.reps).toBe(1234);
  });

  it("rpe is successfully updated", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      rpe: 3,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.rpe).toBe(3);
  });

  it("is_warmup is successfully updated (to true)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);
    let set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(0);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      isWarmup: true,
    });
    expect(res.status).toBe(200);

    set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(1);
  });

  it("is_warmup is successfully updated (to false)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId, { isWarmup: true });
    let set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(1);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      isWarmup: false,
    });
    expect(res.status).toBe(200);

    set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(0);
  });

  it("a combination of 2 fields is successfully updated (1)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      reps: 9876,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.reps).toBe(9876);
  });

  it("a combination of 2 fields is successfully updated (2)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      rpe: 4,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.rpe).toBe(4);
  });

  it("a combination of 2 fields is successfully updated (3)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      rpe: 2,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.rpe).toBe(2);
  });

  it("a combination of 3 fields is successfully updated (1)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      reps: 34857,
      rpe: 2,
    });
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.reps).toBe(34857);
    expect(set.body.data.rpe).toBe(2);
  });

  it("a combination of 3 fields is successfully updated (2)", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);
    let set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(0);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      rpe: 2,
      isWarmup: true,
    });
    expect(res.status).toBe(200);

    set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.rpe).toBe(2);
    expect(set.body.data.is_warmup).toBe(1);
  });

  it("providing all fields updates all of them", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);
    let set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.is_warmup).toBe(0);

    const res = await request(app).patch(`/api/sets/${setId}`).send({
      weight: 1234,
      reps: 34857,
      rpe: 2,
      isWarmup: true,
    });
    expect(res.status).toBe(200);

    set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(200);
    expect(set.body.data.weight).toBe(1234);
    expect(set.body.data.reps).toBe(34857);
    expect(set.body.data.rpe).toBe(2);
    expect(set.body.data.is_warmup).toBe(1);
  });
});

describe("DELETE /api/sets/:setId", async () => {
  it("set not existing returns 200", async () => {
    const res = await request(app).delete(`/api/sets/1`);
    expect(res.status).toBe(200);
  });

  it("set is successfully deleted", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);
    const customExerciseId = await createTestExercise(userId);
    const sessionExerciseId = await createTestSessionExercise(
      sessionId,
      customExerciseId,
    );
    const setId = await createTestSet(sessionExerciseId);

    const res = await request(app).delete(`/api/sets/${setId}`);
    expect(res.status).toBe(200);

    const set = await request(app).get(`/api/sets/${setId}`);
    expect(set.status).toBe(404);
  });
});
