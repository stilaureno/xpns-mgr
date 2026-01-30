import db, { generateId } from "../db/database";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "approver" | "admin";
  createdAt: Date;
}

export class UserService {
  static create(data: Omit<User, "id" | "createdAt">): User {
    const id = generateId();
    const createdAt = new Date();

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, role)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, data.name, data.email, data.role);

    return {
      id,
      ...data,
      createdAt,
    };
  }

  static getAll(): User[] {
    const stmt = db.prepare("SELECT * FROM users ORDER BY name ASC");
    const rows = stmt.all() as any[];

    return rows.map(row => this.mapRowToUser(row));
  }

  static getById(id: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToUser(row);
  }

  static getByEmail(email: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const row = stmt.get(email) as any;

    if (!row) return null;

    return this.mapRowToUser(row);
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: new Date(row.created_at),
    };
  }
}
