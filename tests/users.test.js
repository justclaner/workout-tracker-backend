import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";
import { createTestUser } from "./helpers.js";

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

  it("creating user with taken email returns 400", async () => {
    const res1 = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post("/api/users")
      .send({ email: "test@example.com", password: "password123" });
    expect(res2.status).toBe(400);
  });
});

describe("PATCH /api/users", () => {
  it("user not existing returns 404", async () => {
    const res = await request(app).patch("/api/users/1").send({});
    expect(res.status).toBe(404);
  });

  it("no password returns 400", async () => {
    const userId = await createTestUser();
    const res = await request(app).patch(`/api/users/${userId}`).send({});
    expect(res.status).toBe(400);
  });

  it("password is successfully updated", async () => {
    const userId = await createTestUser();
    const res1 = await request(app).patch(`/api/users/${userId}`).send({
      password: "abc1234",
    });
    expect(res1.status).toBe(200);

    const user = await request(app).get(`/api/users/${userId}`);
    expect(user.status).toBe(200);
    const email = user.body.data.email;

    const res2 = await request(app).post("/api/users/auth").send({
      email: email,
      password: "abc1234",
    });
    console.log(res2);
    expect(res2.status).toBe(200);
    expect(res2.body.data.success).toBe(true);
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
