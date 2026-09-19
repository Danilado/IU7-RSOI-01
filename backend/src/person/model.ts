export interface Person {
  id: number;
  name: string;
  age: number | null;
  address: string | null;
  work: string | null;
}

export interface PersonRequest {
  name: string;
  age?: number | null;
  address?: string | null;
  work?: string | null;
}

export type PersonPatch = Partial<PersonRequest>;

export interface PersonResponse {
  id: number;
  name: string;
  age?: number;
  address?: string;
  work?: string;
}

/** Optional fields are omitted when empty, as declared in person-service.yaml. */
export function toResponse(person: Person): PersonResponse {
  const response: PersonResponse = { id: person.id, name: person.name };
  if (person.age !== null && person.age !== undefined) response.age = person.age;
  if (person.address !== null && person.address !== undefined) response.address = person.address;
  if (person.work !== null && person.work !== undefined) response.work = person.work;
  return response;
}

export interface PersonRepository {
  findAll(): Promise<Person[]>;
  findById(id: number): Promise<Person | null>;
  create(request: PersonRequest): Promise<Person>;
  update(id: number, patch: PersonPatch): Promise<Person | null>;
  remove(id: number): Promise<boolean>;
}
