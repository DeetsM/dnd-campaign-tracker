import { supabase } from '../utils/supabase';

export interface Character {
  id?: string; // Optional for new characters
  name: string;
  maxHP: number;
  ac: number;
  initiative?: number;
}

export interface StoredCharacter extends Character {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export class CharacterService {
  /**
   * Get all saved characters
   */
  static async getAll(): Promise<StoredCharacter[]> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching characters:', error);
      return [];
    }
  }

  /**
   * Get a single character by ID
   */
  static async getById(id: string): Promise<StoredCharacter | null> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching character:', error);
      return null;
    }
  }

  /**
   * Create a new character
   */
  static async create(character: Character): Promise<StoredCharacter | null> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert([
          {
            name: character.name,
            max_hp: character.maxHP,
            ac: character.ac,
            initiative: character.initiative || 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Convert snake_case to camelCase
      return data ? {
        id: data.id,
        name: data.name,
        maxHP: data.max_hp,
        ac: data.ac,
        initiative: data.initiative,
      } : null;
    } catch (error) {
      console.error('Error creating character:', error);
      return null;
    }
  }

  /**
   * Update an existing character
   */
  static async update(id: string, character: Partial<Character>): Promise<StoredCharacter | null> {
    try {
      const updateData: any = {};
      if (character.name) updateData.name = character.name;
      if (character.maxHP !== undefined) updateData.max_hp = character.maxHP;
      if (character.ac !== undefined) updateData.ac = character.ac;
      if (character.initiative !== undefined) updateData.initiative = character.initiative;

      const { data, error } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Convert snake_case to camelCase
      return data ? {
        id: data.id,
        name: data.name,
        maxHP: data.max_hp,
        ac: data.ac,
        initiative: data.initiative,
      } : null;
    } catch (error) {
      console.error('Error updating character:', error);
      return null;
    }
  }

  /**
   * Delete a character
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting character:', error);
      return false;
    }
  }

  /**
   * Delete multiple characters
   */
  static async deleteMany(ids: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting characters:', error);
      return false;
    }
  }
}
