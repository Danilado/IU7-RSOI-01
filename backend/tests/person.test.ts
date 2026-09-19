import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { InMemoryPersonRepository } from "../src/person/inMemoryRepository";

const ALICE = { name: "Alice", age: 31, address: "Baker street 1", work: "Yandex" };

describe("Person REST API", () => {
  let repository: InMemoryPersonRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new InMemoryPersonRepository([ALICE]);
    app = createApp(repository);
  });

  it("GET /api/v1/persons returns all persons", async () => {
    const response = await request(app).get("/api/v1/persons");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toEqual([{ id: 1, ...ALICE }]);
  });

  it("GET /api/v1/persons/{id} returns 404 for an unknown id", async () => {
    const response = await request(app).get("/api/v1/persons/42");

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("42");
  });

  it("POST /api/v1/persons returns 201 with an empty body and a Location header", async () => {
    const response = await request(app)
      .post("/api/v1/persons")
      .send({ name: "Bob", age: 25, address: "Tverskaya 7", work: "VK" });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe("/api/v1/persons/2");
    expect(response.text).toBe("");

    const created = await repository.findById(2);
    expect(created).toMatchObject({ name: "Bob", age: 25, address: "Tverskaya 7", work: "VK" });
  });

  it("POST /api/v1/persons returns 400 when name is missing", async () => {
    const response = await request(app).post("/api/v1/persons").send({ age: 20 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("name");
    expect(await repository.findAll()).toHaveLength(1);
  });

  it("PATCH /api/v1/persons/{id} updates only the passed fields", async () => {
    const response = await request(app)
      .patch("/api/v1/persons/1")
      .send({ name: "Alice Cooper", address: "Arbat 12" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 1,
      name: "Alice Cooper",
      address: "Arbat 12",
      age: ALICE.age,
      work: ALICE.work
    });
  });

  it("DELETE /api/v1/persons/{id} returns 204 and removes the person", async () => {
    const response = await request(app).delete("/api/v1/persons/1");

    expect(response.status).toBe(204);
    expect(await repository.findById(1)).toBeNull();
  });
});
