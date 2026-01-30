import { pool, generateId } from "../db/mariadb";

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
}

export class CategoryService {
  static async create(data: Omit<Category, "id" | "createdAt">): Promise<Category> {
    const id = generateId();
    const createdAt = new Date();

    await pool.execute(
      "INSERT INTO categories (id, name, description, color) VALUES (?, ?, ?, ?)",
      [id, data.name, data.description || null, data.color]
    );

    return {
      id,
      ...data,
      createdAt,
    };
  }

  static async getAll(): Promise<Category[]> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM categories ORDER BY name ASC"
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: new Date(row.created_at),
    }));
  }

  static async getById(id: string): Promise<Category | null> {
    const [rows]: any = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: new Date(row.created_at),
    };
  }

  static async update(id: string, updates: Partial<Omit<Category, "id" | "createdAt">>): Promise<Category | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push("description = ?");
      values.push(updates.description);
    }
    if (updates.color !== undefined) {
      fields.push("color = ?");
      values.push(updates.color);
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);

    await pool.execute(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return this.getById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const [result]: any = await pool.execute(
      "DELETE FROM categories WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}
