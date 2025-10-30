export interface Character {
  name: string;
  maxHP: number;
  initiative?: number; // Optional during combat setup
  ac: number;
  conditions?: string[]; // Optional condition effects (stunned, poisoned, etc.)
}

export interface Combatant extends Character {
  id: string;
  currentHP: number;
  initiative: number;
  isPlayer: boolean;
}