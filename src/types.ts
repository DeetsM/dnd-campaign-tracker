export interface Character {
  name: string;
  maxHP: number;
  initiative?: number; // Optional during combat setup
  ac: number;
  conditions?: string[]; // Optional condition effects (stunned, poisoned, etc.)
}

export interface NPC extends Character {
  id: string;
  type: 'enemy' | 'ally';
  created_at?: string;
  updated_at?: string;
}

export interface Combatant extends Character {
  id: string;
  currentHP: number;
  initiative: number;
  isPlayer: boolean;
  npcType?: 'enemy' | 'ally'; // Track if combatant came from NPC storage
}