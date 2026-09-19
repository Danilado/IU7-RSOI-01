export interface Person {
  id: number;
  name: string;
  age?: number;
  address?: string;
  work?: string;
}

export interface PersonRequest {
  name: string;
  age?: number | null;
  address?: string | null;
  work?: string | null;
}

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/v1/persons`;

interface ErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

async function fail(response: Response): Promise<never> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // an empty or non-JSON body leaves only the status to report
  }

  const details = body.errors
    ? Object.entries(body.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(", ")
    : undefined;

  throw new Error(
    [body.message ?? `Request failed with status ${response.status}`, details].filter(Boolean).join(" — ")
  );
}

export async function listPersons(): Promise<Person[]> {
  const response = await fetch(BASE_URL);
  if (!response.ok) return fail(response);
  return (await response.json()) as Person[];
}

export async function getPerson(id: number): Promise<Person> {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) return fail(response);
  return (await response.json()) as Person;
}

/** POST answers with 201 + Location, so the created entity is fetched by the id from that header. */
export async function createPerson(request: PersonRequest): Promise<Person> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) return fail(response);

  const location = response.headers.get("Location");
  const id = Number(location?.split("/").pop());
  if (!Number.isInteger(id)) throw new Error("Server did not return a Location header for the new person");
  return getPerson(id);
}

export async function updatePerson(id: number, request: Partial<PersonRequest>): Promise<Person> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) return fail(response);
  return (await response.json()) as Person;
}

export async function deletePerson(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) return fail(response);
}
