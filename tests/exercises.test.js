import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

let userCounter = 0;
async function createTestUser() {
  userCounter++;
  const res = await request(app)
    .post("/api/users")
    .send({ email: `test${userCounter}@example.com`, password: "password123" });
  return res.body.data.lastInsertRowid;
}

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

    expect(res.status).toBe(200);
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
