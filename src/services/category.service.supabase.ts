import { supabase, Category as SupabaseCategory } from '../db/database-supabase';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
}

export class CategoryService {
  // Create a new category
  static async create(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category | null> {
    const now = new Date();

    const category: Category = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
    };

    const { data: insertedCategory, error } = await supabase
      .from('categories')
      .insert([{
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    return this.mapRowToCategory(insertedCategory);
  }

  // Get category by ID
  static async getById(id: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      console.error('Error getting category by ID:', error);
      return null;
    }

    return this.mapRowToCategory(category);
  }

  // Get all categories
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting all categories:', error);
      return [];
    }

    return data.map(row => this.mapRowToCategory(row));
  }

  // Update category
  static async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    const category = await this.getById(id);
    if (!category) return null;

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.color !== undefined) updateData.color = updates.color;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return this.mapRowToCategory(data);
  }

  // Delete category
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  }

  // Find category by name
  static async findByName(name: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .single();

    if (error || !category) {
      return null;
    }

    return this.mapRowToCategory(category);
  }

  // Helper to map database row to Category object
  private static mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      color: row.color || undefined,
      createdAt: new Date(row.created_at),
    };
  }
}