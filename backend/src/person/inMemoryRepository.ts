import { Person, PersonPatch, PersonRepository, PersonRequest } from "./model";

/** Used by unit tests so they do not need a running Postgres. */
export class InMemoryPersonRepository implements PersonRepository {
  private readonly persons = new Map<number, Person>();
  private sequence = 0;

  constructor(initial: PersonRequest[] = []) {
    for (const request of initial) {
      void this.create(request);
    }
  }

  async findAll(): Promise<Person[]> {
    return [...this.persons.values()].sort((left, right) => left.id - right.id);
  }

  async findById(id: number): Promise<Person | null> {
    return this.persons.get(id) ?? null;
  }

  async create(request: PersonRequest): Promise<Person> {
    const person: Person = {
      id: ++this.sequence,
      name: request.name,
      age: request.age ?? null,
      address: request.address ?? null,
      work: request.work ?? null
    };
    this.persons.set(person.id, person);
    return person;
  }

  async update(id: number, patch: PersonPatch): Promise<Person | null> {
    const stored = this.persons.get(id);
    if (!stored) return null;

    const updated: Person = {
      ...stored,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.age !== undefined ? { age: patch.age } : {}),
      ...(patch.address !== undefined ? { address: patch.address } : {}),
      ...(patch.work !== undefined ? { work: patch.work } : {})
    };
    this.persons.set(id, updated);
    return updated;
  }

  async remove(id: number): Promise<boolean> {
    return this.persons.delete(id);
  }
}
