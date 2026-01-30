import { pool, generateId } from "../db/mariadb";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "approver" | "admin";
  createdAt: Date;
}

export class UserService {
  static async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = generateId();
    const createdAt = new Date();

    await pool.execute(
      "INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)",
      [id, data.name, data.email, data.role]
    );

    return {
      id,
      ...data,
      createdAt,
    };
  }

  static async getAll(): Promise<User[]> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM users ORDER BY name ASC"
    );

    return rows.map((row: any) => this.mapRowToUser(row));
  }

  static async getById(id: string): Promise<User | null> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) return null;

    return this.mapRowToUser(rows[0]);
  }

  static async getByEmail(email: string): Promise<User | null> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) return null;

    return this.mapRowToUser(rows[0]);
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
