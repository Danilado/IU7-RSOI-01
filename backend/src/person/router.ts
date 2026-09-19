import { Request, Response, Router } from "express";
import { PersonRepository, toResponse } from "./model";
import { parseCreateRequest, parsePatchRequest, ValidationError } from "./validation";

const NOT_FOUND = (id: number) => ({ message: `Person with id ${id} not found` });

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

function handleError(error: unknown, response: Response): void {
  if (error instanceof ValidationError) {
    response.status(400).json({ message: error.message, errors: error.errors });
    return;
  }
  console.error("Unexpected error while handling request", error);
  response.status(500).json({ message: "Internal server error" });
}

export function personRouter(repository: PersonRepository): Router {
  const router = Router();

  router.get("/", async (_request: Request, response: Response) => {
    try {
      const persons = await repository.findAll();
      response.status(200).json(persons.map(toResponse));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.get("/:id", async (request: Request, response: Response) => {
    const id = parseId(request.params.id);
    if (id === null) {
      response.status(404).json({ message: `Person with id ${request.params.id} not found` });
      return;
    }
    try {
      const person = await repository.findById(id);
      if (!person) {
        response.status(404).json(NOT_FOUND(id));
        return;
      }
      response.status(200).json(toResponse(person));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.post("/", async (request: Request, response: Response) => {
    try {
      const person = await repository.create(parseCreateRequest(request.body));
      response.status(201).location(`/api/v1/persons/${person.id}`).send();
    } catch (error) {
      handleError(error, response);
    }
  });

  router.patch("/:id", async (request: Request, response: Response) => {
    const id = parseId(request.params.id);
    if (id === null) {
      response.status(404).json({ message: `Person with id ${request.params.id} not found` });
      return;
    }
    try {
      const person = await repository.update(id, parsePatchRequest(request.body));
      if (!person) {
        response.status(404).json(NOT_FOUND(id));
        return;
      }
      response.status(200).json(toResponse(person));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.delete("/:id", async (request: Request, response: Response) => {
    const id = parseId(request.params.id);
    if (id === null) {
      response.status(204).send();
      return;
    }
    try {
      await repository.remove(id);
      response.status(204).send();
    } catch (error) {
      handleError(error, response);
    }
  });

  return router;
}
