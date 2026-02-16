import { getSupabaseClient, User as SupabaseUser } from '../db/database-supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'approver' | 'admin';
  createdAt: Date;
}

export class UserService {
  // Create a new user
  static async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
    const now = new Date();

    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
    };

    const { data: insertedUser, error } = await getSupabaseClient()
      .from('users')
      .insert([{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return this.mapRowToUser(insertedUser);
  }

  // Get user by ID
  static async getById(id: string): Promise<User | null> {
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      console.error('Error getting user by ID:', error);
      return null;
    }

    return this.mapRowToUser(user);
  }

  // Get user by email
  static async getByEmail(email: string): Promise<User | null> {
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('Error getting user by email:', error);
      return null;
    }

    return this.mapRowToUser(user);
  }

  // Get all users
  static async getAll(): Promise<User[]> {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }

    return data.map(row => this.mapRowToUser(row));
  }

  // Update user
  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.getById(id);
    if (!user) return null;

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;

    const { data, error } = await getSupabaseClient()
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return this.mapRowToUser(data);
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    const { error } = await getSupabaseClient()
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  }

  // Helper to map database row to User object
  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as 'user' | 'approver' | 'admin',
      createdAt: new Date(row.created_at),
    };
  }
}