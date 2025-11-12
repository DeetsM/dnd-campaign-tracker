import { supabase } from '../utils/supabase';
import { CombatHistory } from '../context/CombatContext';

export class CombatService {
  /**
   * Get all combat history records for the current session/user
   */
  static async getHistory(): Promise<CombatHistory[]> {
    try {
      const { data, error } = await supabase
        .from('combat_history')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(record => ({
        ...record,
        date: new Date(record.date),
        combatants: JSON.parse(record.combatants),
        logEntries: JSON.parse(record.log_entries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        stats: JSON.parse(record.stats),
      }));
    } catch (error) {
      console.error('Error fetching combat history:', error);
      return [];
    }
  }

  /**
   * Get a single combat history record by ID
   */
  static async getHistoryById(id: string): Promise<CombatHistory | null> {
    try {
      const { data, error } = await supabase
        .from('combat_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        date: new Date(data.date),
        combatants: JSON.parse(data.combatants),
        logEntries: JSON.parse(data.log_entries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        stats: JSON.parse(data.stats),
      };
    } catch (error) {
      console.error('Error fetching combat history by ID:', error);
      return null;
    }
  }

  /**
   * Save a new combat history record
   */
  static async saveCombat(combat: CombatHistory): Promise<CombatHistory | null> {
    try {
      const { data, error } = await supabase
        .from('combat_history')
        .insert([
          {
            id: combat.id,
            title: combat.title,
            date: combat.date.toISOString(),
            combatants: JSON.stringify(combat.combatants),
            log_entries: JSON.stringify(combat.logEntries),
            rounds: combat.rounds,
            stats: JSON.stringify(combat.stats),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        date: new Date(data.date),
        combatants: JSON.parse(data.combatants),
        logEntries: JSON.parse(data.log_entries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        stats: JSON.parse(data.stats),
      };
    } catch (error) {
      console.error('Error saving combat:', error);
      return null;
    }
  }

  /**
   * Update an existing combat history record
   */
  static async updateCombat(combat: CombatHistory): Promise<CombatHistory | null> {
    try {
      const { data, error } = await supabase
        .from('combat_history')
        .update({
          title: combat.title,
          date: combat.date.toISOString(),
          combatants: JSON.stringify(combat.combatants),
          log_entries: JSON.stringify(combat.logEntries),
          rounds: combat.rounds,
          stats: JSON.stringify(combat.stats),
        })
        .eq('id', combat.id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        date: new Date(data.date),
        combatants: JSON.parse(data.combatants),
        logEntries: JSON.parse(data.log_entries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })),
        stats: JSON.parse(data.stats),
      };
    } catch (error) {
      console.error('Error updating combat:', error);
      return null;
    }
  }

  /**
   * Delete a combat history record
   */
  static async deleteCombat(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('combat_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting combat:', error);
      return false;
    }
  }
}
