import db, { generateId } from "../db/database";

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
}

export class CategoryService {
  static create(data: Omit<Category, "id" | "createdAt">): Category {
    const id = generateId();
    const createdAt = new Date();

    const stmt = db.prepare(`
      INSERT INTO categories (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, data.name, data.description || null, data.color);

    return {
      id,
      ...data,
      createdAt,
    };
  }

  static getAll(): Category[] {
    const stmt = db.prepare("SELECT * FROM categories ORDER BY name ASC");
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: new Date(row.created_at),
    }));
  }

  static getById(id: string): Category | null {
    const stmt = db.prepare("SELECT * FROM categories WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      createdAt: new Date(row.created_at),
    };
  }

  static update(id: string, updates: Partial<Omit<Category, "id" | "createdAt">>): Category | null {
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

    const stmt = db.prepare(`
      UPDATE categories SET ${fields.join(", ")} WHERE id = ?
    `);

    stmt.run(...values);

    return this.getById(id);
  }

  static delete(id: string): boolean {
    const stmt = db.prepare("DELETE FROM categories WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
