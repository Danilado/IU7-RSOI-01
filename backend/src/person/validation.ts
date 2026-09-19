import { PersonPatch, PersonRequest } from "./model";

export type ValidationErrors = Record<string, string>;

export class ValidationError extends Error {
  readonly errors: ValidationErrors;

  constructor(errors: ValidationErrors) {
    super("Invalid data");
    this.errors = errors;
  }
}

const MAX_NAME_LENGTH = 255;
const MAX_TEXT_LENGTH = 255;
const MAX_AGE = 150;

function validateName(value: unknown, errors: ValidationErrors): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.name = "must not be blank";
    return undefined;
  }
  const name = value.trim();
  if (name.length > MAX_NAME_LENGTH) {
    errors.name = `must be shorter than ${MAX_NAME_LENGTH} characters`;
    return undefined;
  }
  return name;
}

function validateAge(value: unknown, errors: ValidationErrors): number | null | undefined {
  if (value === null) return null;
  if (!Number.isInteger(value)) {
    errors.age = "must be an integer";
    return undefined;
  }
  const age = value as number;
  if (age < 0 || age > MAX_AGE) {
    errors.age = `must be between 0 and ${MAX_AGE}`;
    return undefined;
  }
  return age;
}

function validateText(field: string, value: unknown, errors: ValidationErrors): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") {
    errors[field] = "must be a string";
    return undefined;
  }
  if (value.length > MAX_TEXT_LENGTH) {
    errors[field] = `must be shorter than ${MAX_TEXT_LENGTH} characters`;
    return undefined;
  }
  return value;
}

function asObject(body: unknown, errors: ValidationErrors): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    errors.body = "must be a JSON object";
    throw new ValidationError(errors);
  }
  return body as Record<string, unknown>;
}

/** POST body: name is required, the rest is optional. */
export function parseCreateRequest(body: unknown): PersonRequest {
  const errors: ValidationErrors = {};
  const raw = asObject(body, errors);

  const request: PersonRequest = { name: "" };
  const name = validateName(raw.name, errors);
  if (name !== undefined) request.name = name;
  if ("age" in raw) request.age = validateAge(raw.age, errors) ?? null;
  if ("address" in raw) request.address = validateText("address", raw.address, errors) ?? null;
  if ("work" in raw) request.work = validateText("work", raw.work, errors) ?? null;

  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return request;
}

/** PATCH body: every field is optional, absent fields keep their stored value. */
export function parsePatchRequest(body: unknown): PersonPatch {
  const errors: ValidationErrors = {};
  const raw = asObject(body, errors);

  const patch: PersonPatch = {};
  if ("name" in raw) {
    const name = validateName(raw.name, errors);
    if (name !== undefined) patch.name = name;
  }
  if ("age" in raw) {
    const age = validateAge(raw.age, errors);
    if (age !== undefined) patch.age = age;
  }
  if ("address" in raw) {
    const address = validateText("address", raw.address, errors);
    if (address !== undefined) patch.address = address;
  }
  if ("work" in raw) {
    const work = validateText("work", raw.work, errors);
    if (work !== undefined) patch.work = work;
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return patch;
}
