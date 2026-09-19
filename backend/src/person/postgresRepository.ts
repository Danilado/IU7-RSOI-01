import { Pool } from "pg";
import { Person, PersonPatch, PersonRepository, PersonRequest } from "./model";

interface PersonRow {
  id: number;
  name: string;
  age: number | null;
  address: string | null;
  work: string | null;
}

function toPerson(row: PersonRow): Person {
  return {
    id: Number(row.id),
    name: row.name,
    age: row.age === null ? null : Number(row.age),
    address: row.address,
    work: row.work
  };
}

export class PostgresPersonRepository implements PersonRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Person[]> {
    const result = await this.pool.query<PersonRow>(
      "SELECT id, name, age, address, work FROM persons ORDER BY id"
    );
    return result.rows.map(toPerson);
  }

  async findById(id: number): Promise<Person | null> {
    const result = await this.pool.query<PersonRow>(
      "SELECT id, name, age, address, work FROM persons WHERE id = $1",
      [id]
    );
    return result.rows.length > 0 ? toPerson(result.rows[0]) : null;
  }

  async create(request: PersonRequest): Promise<Person> {
    const result = await this.pool.query<PersonRow>(
      `INSERT INTO persons (name, age, address, work)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, age, address, work`,
      [request.name, request.age ?? null, request.address ?? null, request.work ?? null]
    );
    return toPerson(result.rows[0]);
  }

  async update(id: number, patch: PersonPatch): Promise<Person | null> {
    const columns: Array<keyof PersonPatch> = ["name", "age", "address", "work"];
    const assignments: string[] = [];
    const values: unknown[] = [];

    for (const column of columns) {
      if (patch[column] !== undefined) {
        values.push(patch[column]);
        assignments.push(`${column} = $${values.length}`);
      }
    }

    if (assignments.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.pool.query<PersonRow>(
      `UPDATE persons SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING id, name, age, address, work`,
      values
    );
    return result.rows.length > 0 ? toPerson(result.rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pool.query("DELETE FROM persons WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
