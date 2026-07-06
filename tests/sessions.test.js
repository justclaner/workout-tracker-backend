import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../api/app.js";

import { createTestUser, createTestSession } from "./helpers.js";

describe("GET /api/sessions", () => {
  it("returns an array", async () => {
    const res = await request(app).get("/api/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("GET /api/sessions/:sessionId", () => {
  it("session is successfully retrieved", async () => {
    const userId = await createTestUser();
    const sessionId = await createTestSession(userId);

    const res = await request(app).get(`/api/sessions/${sessionId}`);
    expect(res.status).toBe(200);
  });
});
