import { supabase } from '../utils/supabase';
import { NPC } from '../types';

export interface StoredNPC extends NPC {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export class NPCService {
  /**
   * Get all NPCs, optionally filtered by type
   */
  static async getAll(type?: 'enemy' | 'ally'): Promise<StoredNPC[]> {
    try {
      let query = supabase.from('npcs').select('*');
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      // Convert snake_case to camelCase
      return (data || []).map(npc => ({
        id: npc.id,
        name: npc.name,
        maxHP: npc.max_hp,
        ac: npc.ac,
        initiative: npc.initiative,
        type: npc.type,
        created_at: npc.created_at,
        updated_at: npc.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching NPCs:', error);
      return [];
    }
  }

  /**
   * Get all enemies
   */
  static async getEnemies(): Promise<StoredNPC[]> {
    return this.getAll('enemy');
  }

  /**
   * Get all allies
   */
  static async getAllies(): Promise<StoredNPC[]> {
    return this.getAll('ally');
  }

  /**
   * Get a single NPC by ID
   */
  static async getById(id: string): Promise<StoredNPC | null> {
    try {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Convert snake_case to camelCase
      return data ? {
        id: data.id,
        name: data.name,
        maxHP: data.max_hp,
        ac: data.ac,
        initiative: data.initiative,
        type: data.type,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } : null;
    } catch (error) {
      console.error('Error fetching NPC:', error);
      return null;
    }
  }

  /**
   * Create a new NPC
   */
  static async create(npc: Omit<NPC, 'id'>): Promise<StoredNPC | null> {
    try {
      const { data, error } = await supabase
        .from('npcs')
        .insert([
          {
            name: npc.name,
            max_hp: npc.maxHP,
            ac: npc.ac,
            initiative: npc.initiative || 0,
            type: npc.type,
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
        type: data.type,
      } : null;
    } catch (error) {
      console.error('Error creating NPC:', error);
      return null;
    }
  }

  /**
   * Update an existing NPC
   */
  static async update(id: string, npc: Partial<NPC>): Promise<StoredNPC | null> {
    try {
      const updateData: any = {};
      if (npc.name) updateData.name = npc.name;
      if (npc.maxHP !== undefined) updateData.max_hp = npc.maxHP;
      if (npc.ac !== undefined) updateData.ac = npc.ac;
      if (npc.initiative !== undefined) updateData.initiative = npc.initiative;
      if (npc.type) updateData.type = npc.type;

      const { data, error } = await supabase
        .from('npcs')
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
        type: data.type,
      } : null;
    } catch (error) {
      console.error('Error updating NPC:', error);
      return null;
    }
  }

  /**
   * Delete an NPC
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('npcs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting NPC:', error);
      return false;
    }
  }

  /**
   * Delete multiple NPCs
   */
  static async deleteMany(ids: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('npcs')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting NPCs:', error);
      return false;
    }
  }
}
