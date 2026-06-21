import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

describe("POST /api/users", () => {
  it("creates a user with valid email and password", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.data.lastInsertRowid).toBeDefined();
  });

  it("rejects missing email", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("rejects missing password", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });
});

describe("POST /api/users/auth", () => {
  it("authenticates with correct credentials", async () => {
    await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });

  it("rejects wrong password", async () => {
    await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/users/auth")
      .send({ email: "ghost@example.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/users/:userId", () => {
  it("deletes an existing user", async () => {
    const createRes = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });

    const userId = createRes.body.data.lastInsertRowid;

    const res = await request(app).delete(`/api/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.changes).toBe(1);
  });
});
