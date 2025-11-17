import { CharacterService } from './characterService';
import { NPCService } from './npcService';

export interface CharacterStats {
  characterId: string;
  characterName: string;
  nat20s: number;
  nat1s: number;
  totalKills: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  maxDamageDealtInCombat: number;
  maxDamageTakenInCombat: number;
  totalHits: number;
  totalMisses: number;
  totalHitsAgainst: number;
  totalMissesAgainst: number;
  totalSavingThrowsForced: number;
  totalSavingThrowsMade: number;
}

export class CharacterStatsService {
  /**
   * Get roll statistics for a character
   */
  static async getRollStats(characterId: string): Promise<{ nat20s: number; nat1s: number }> {
    try {
      const character = await CharacterService.getById(characterId);
      if (!character) return { nat20s: 0, nat1s: 0 };

      return {
        nat20s: character.nat20s || 0,
        nat1s: character.nat1s || 0
      };
    } catch (error) {
      console.error('Error fetching roll stats:', error);
      return { nat20s: 0, nat1s: 0 };
    }
  }

  /**
   * Add a nat 20 or nat 1 roll - increments the character's or NPC's count
   */
  static async addRoll(characterId: string, rollType: 'nat20' | 'nat1'): Promise<boolean> {
    try {
      // Try to get as a character first
      let character = await CharacterService.getById(characterId);
      
      // If not a character, try to get as an NPC
      if (!character) {
        const npc = await NPCService.getById(characterId);
        if (!npc) return false;

        const currentCount = rollType === 'nat20' ? (npc.nat20s || 0) : (npc.nat1s || 0);
        const updateData = {
          [rollType === 'nat20' ? 'nat20s' : 'nat1s']: currentCount + 1
        };

        const updated = await NPCService.update(characterId, updateData as any);
        return updated !== null;
      }

      // Update as character
      const currentCount = rollType === 'nat20' ? (character.nat20s || 0) : (character.nat1s || 0);
      const updateData = {
        [rollType === 'nat20' ? 'nat20s' : 'nat1s']: currentCount + 1
      };

      const updated = await CharacterService.update(characterId, updateData as any);
      return updated !== null;
    } catch (error) {
      console.error('Error adding roll:', error);
      return false;
    }
  }

  /**
   * Get roll stats for all characters and NPCs
   */
  static async getAllRollStats(): Promise<{ [characterId: string]: { nat20s: number; nat1s: number } }> {
    try {
      const characters = await CharacterService.getAll();
      const allies = await NPCService.getAllies();
      const enemies = await NPCService.getEnemies();
      
      const stats: { [characterId: string]: { nat20s: number; nat1s: number } } = {};

      // Add character stats
      characters.forEach(char => {
        if (char.id) {
          stats[char.id] = {
            nat20s: char.nat20s || 0,
            nat1s: char.nat1s || 0
          };
        }
      });

      // Add ally stats
      allies.forEach(npc => {
        if (npc.id) {
          stats[npc.id] = {
            nat20s: npc.nat20s || 0,
            nat1s: npc.nat1s || 0
          };
        }
      });

      // Add enemy stats
      enemies.forEach(npc => {
        if (npc.id) {
          stats[npc.id] = {
            nat20s: npc.nat20s || 0,
            nat1s: npc.nat1s || 0
          };
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching all roll stats:', error);
      return {};
    }
  }
}
