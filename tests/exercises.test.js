import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

import { createTestUser } from "./helpers.js";
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
