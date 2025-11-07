import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Character } from '../types';

interface Combatant extends Character {
  id: string;
  currentHP: number;
  tempHP: number;
  initiative: number;
  isPlayer: boolean;
  conditions?: string[];
}

interface SaveState {
  type: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  dc: number;
  successes: string[];
  targets: string[];
  halfDamageOnSave: boolean;
  damage: number;
  status?: string;
}

interface CombatLogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: 'damage' | 'healing' | 'status' | 'round' | 'turn';
}

export interface CombatStats {
  damageDealt: { [key: string]: number };
  damageTaken: { [key: string]: number };
  healingDone: { [key: string]: number };
  healingReceived: { [key: string]: number };
  hits: { [key: string]: number };
  misses: { [key: string]: number };
  savingThrowsForced: { [key: string]: number };
  savingThrowsMade: { [key: string]: number };
  savingThrowsFailed: { [key: string]: number };
  kills: { [key: string]: number };
  knockouts: { [key: string]: number };
}

export interface CombatHistory {
  id: string;
  title: string;
  date: Date;
  combatants: Combatant[];
  logEntries: CombatLogEntry[];
  rounds: number;
  stats: CombatStats;
}

interface CombatState {
  combatants: Combatant[];
  phase: 'setup' | 'active';
  currentTurn: number;
  round: number;
  activeSave?: SaveState;
  lastUpdated: number;
  logEntries: CombatLogEntry[];
  history: CombatHistory[];
}

interface CombatContextType {
  combatState: CombatState;
  updateCombatState: ((state: Partial<CombatState>) => void) & ((updater: (prev: CombatState) => CombatState) => void);
  addCombatant: (combatant: Omit<Combatant, 'id'>) => void;
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  removeCombatant: (id: string) => void;
  resetCombat: () => void;
  endCombat: () => void;
  getCombatHistory: () => CombatHistory[];
  getCombatDetails: (id: string) => CombatHistory | undefined;
  updateCombatTitle: (id: string, newTitle: string) => void;
}

const defaultCombatState: CombatState = {
  combatants: [],
  phase: 'setup',
  currentTurn: 0,
  round: 1,
  logEntries: [],
  lastUpdated: Date.now(),
  history: [], // Ensure history is initialized as an empty array
};

const CombatContext = createContext<CombatContextType | undefined>(undefined);

export function CombatProvider({ children }: { children: ReactNode }) {
  const [combatState, setCombatState] = useState<CombatState>(() => {
    const saved = localStorage.getItem('combatState');
    if (!saved) return defaultCombatState;
    
    const parsed = JSON.parse(saved);
    // Ensure history exists and convert dates
    const history = parsed.history || [];
    history.forEach((combat: CombatHistory) => {
      combat.date = new Date(combat.date);
      combat.logEntries.forEach(entry => {
        entry.timestamp = new Date(entry.timestamp);
      });
    });

    return {
      ...parsed,
      history,
      logEntries: parsed.logEntries || [],
      lastUpdated: parsed.lastUpdated || Date.now()
    };
  });

  // Save to localStorage whenever combat state changes
  useEffect(() => {
    localStorage.setItem('combatState', JSON.stringify(combatState));
  }, [combatState]);

  // Poll for updates in localStorage
  useEffect(() => {
    const checkForUpdates = () => {
      const savedState = localStorage.getItem('combatState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only update if the saved state is newer than our current state
        if (parsed.lastUpdated > combatState.lastUpdated) {
          setCombatState(parsed);
        }
      }
    };

    // Check for updates every second
    const interval = setInterval(checkForUpdates, 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [combatState.lastUpdated]);

  const updateCombatState = (updater: Partial<CombatState> | ((prev: CombatState) => CombatState)) => {
    if (typeof updater === 'function') {
      setCombatState(prev => ({
        ...updater(prev),
        lastUpdated: Date.now()
      }));
    } else {
      setCombatState(prev => ({
        ...prev,
        ...updater,
        lastUpdated: Date.now()
      }));
    }
  };

  const addCombatant = (combatant: Omit<Combatant, 'id'>) => {
    const newCombatant: Combatant = {
      ...combatant,
      id: Date.now().toString(),
    };
    setCombatState(prev => ({
      ...prev,
      combatants: [...prev.combatants, newCombatant],
    }));
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const removeCombatant = (id: string) => {
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.filter(c => c.id !== id),
    }));
  };

  const resetCombat = () => {
    setCombatState(defaultCombatState);
  };

  const calculateCombatStats = () => {
    const stats = {
      damageDealt: {} as { [key: string]: number },
      damageTaken: {} as { [key: string]: number },
      healingDone: {} as { [key: string]: number },
      healingReceived: {} as { [key: string]: number },
      hits: {} as { [key: string]: number },
      misses: {} as { [key: string]: number },
      savingThrowsForced: {} as { [key: string]: number },
      savingThrowsMade: {} as { [key: string]: number },
      savingThrowsFailed: {} as { [key: string]: number },
      kills: {} as { [key: string]: number },
      knockouts: {} as { [key: string]: number },
    };

    combatState.logEntries.forEach(entry => {
      const damageMatch = entry.text.match(/(.+) hit (.+) for (\d+) damage/);
      const missMatch = entry.text.match(/(.+) missed (.+)/);
      const healingMatch = entry.text.match(/(.+) healed (.+) for (\d+) HP/);
      const saveSuccessMatch = entry.text.match(/(.+) succeeded on their (\w+) save/);
      const saveFailMatch = entry.text.match(/(.+) failed their (\w+) save/);
      const unconsciousMatch = entry.text.match(/(.+) falls unconscious!/);
      const reviveMatch = entry.text.match(/(.+) is back on their feet!/);

      if (damageMatch) {
        const [_, source, targets, amount] = damageMatch;
        const damage = parseInt(amount);
        targets.split(', ').forEach(target => {
          // Track damage
          stats.damageDealt[source] = (stats.damageDealt[source] || 0) + damage;
          stats.damageTaken[target] = (stats.damageTaken[target] || 0) + damage;
          // Track hits
          stats.hits[source] = (stats.hits[source] || 0) + 1;
        });
      } else if (missMatch) {
        const [_, source, targets] = missMatch;
        // Track misses
        stats.misses[source] = (stats.misses[source] || 0) + targets.split(', ').length;
      } else if (healingMatch) {
        const [_, source, targets, amount] = healingMatch;
        const healing = parseInt(amount);
        targets.split(', ').forEach(target => {
          stats.healingDone[source] = (stats.healingDone[source] || 0) + healing;
          stats.healingReceived[target] = (stats.healingReceived[target] || 0) + healing;
        });
      } else if (saveSuccessMatch) {
        const [_, targets] = saveSuccessMatch;
        targets.split(', ').forEach(target => {
          stats.savingThrowsMade[target] = (stats.savingThrowsMade[target] || 0) + 1;
          // The previous entry should contain who forced the save
          const prevEntry = combatState.logEntries[combatState.logEntries.indexOf(entry) - 1];
          if (prevEntry) {
            const source = prevEntry.text.match(/(.+)'s \w+ save/)?.[1];
            if (source) {
              stats.savingThrowsForced[source] = (stats.savingThrowsForced[source] || 0) + 1;
            }
          }
        });
      } else if (saveFailMatch) {
        const [_, targets] = saveFailMatch;
        targets.split(', ').forEach(target => {
          stats.savingThrowsFailed[target] = (stats.savingThrowsFailed[target] || 0) + 1;
          // The previous entry should contain who forced the save
          const prevEntry = combatState.logEntries[combatState.logEntries.indexOf(entry) - 1];
          if (prevEntry) {
            const source = prevEntry.text.match(/(.+)'s \w+ save/)?.[1];
            if (source) {
              stats.savingThrowsForced[source] = (stats.savingThrowsForced[source] || 0) + 1;
            }
          }
        });
      } else if (unconsciousMatch) {
        const [_, target] = unconsciousMatch;
        // Find who dealt the final blow from the previous entry
        const prevEntry = combatState.logEntries[combatState.logEntries.indexOf(entry) - 1];
        if (prevEntry) {
          const source = prevEntry.text.match(/(.+) hit/)?.[1] || prevEntry.text.match(/(.+)'s \w+ save/)?.[1];
          if (source) {
            stats.kills[source] = (stats.kills[source] || 0) + 1;
          }
        }
        stats.knockouts[target] = (stats.knockouts[target] || 0) + 1;
      }
    });

    return stats;
  };

  const generateDefaultTitle = (combatants: Combatant[]) => {
    const players = combatants.filter(c => c.isPlayer).map(c => c.name);
    const enemies = combatants.filter(c => !c.isPlayer).map(c => c.name);
    if (players.length === 0 && enemies.length === 0) return "Untitled Combat";
    return `${players.join(", ")} vs ${enemies.join(", ")}`;
  };

  const endCombat = () => {
    if (combatState.phase === 'active' && combatState.combatants.length > 0) {
      const newHistory: CombatHistory = {
        id: Date.now().toString(),
        title: generateDefaultTitle(combatState.combatants),
        date: new Date(),
        combatants: combatState.combatants,
        logEntries: combatState.logEntries,
        rounds: combatState.round,
        stats: calculateCombatStats(),
      };

      setCombatState(prev => ({
        ...defaultCombatState,
        history: [newHistory, ...(prev.history || [])]
      }));
    }
  };

  const updateCombatTitle = (id: string, newTitle: string) => {
    setCombatState(prev => ({
      ...prev,
      history: prev.history.map(combat => 
        combat.id === id 
          ? { ...combat, title: newTitle }
          : combat
      )
    }));
  };

  const getCombatHistory = () => {
    return combatState.history;
  };

  const getCombatDetails = (id: string) => {
    return combatState.history.find(combat => combat.id === id);
  };

  const value = {
    combatState,
    updateCombatState,
    addCombatant,
    updateCombatant,
    removeCombatant,
    resetCombat,
    endCombat,
    getCombatHistory,
    getCombatDetails,
    updateCombatTitle,
  };

  return (
    <CombatContext.Provider value={value}>
      {children}
    </CombatContext.Provider>
  );
}

export function useCombat() {
  const context = useContext(CombatContext);
  if (!context) {
    throw new Error('useCombat must be used within a CombatProvider');
  }
  return context;
}