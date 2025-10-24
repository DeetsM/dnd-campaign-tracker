import { useState, FormEvent } from 'react'
import { Character } from '../types'

interface CombatTrackerProps {
  savedCharacters: Character[];
}

interface Combatant extends Character {
  id: string;
  currentHP: number;
}

export function CombatTracker({ savedCharacters }: CombatTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    maxHP: 0,
    ac: 0,
  });

  const handleAddCombatant = (e: FormEvent) => {
    e.preventDefault();
    const combatant: Combatant = {
      id: Date.now().toString(),
      name: newCombatant.name,
      initiative: newCombatant.initiative,
      currentHP: newCombatant.maxHP,
      maxHP: newCombatant.maxHP,
      ac: newCombatant.ac,
    };
    setCombatants([...combatants, combatant]);
    setNewCombatant({ name: '', initiative: 0, maxHP: 0, ac: 0 });
  };

  const handleAddSavedCharacter = (character: Character) => {
    const combatant: Combatant = {
      ...character,
      id: Date.now().toString(),
      currentHP: character.maxHP,
    };
    setCombatants([...combatants, combatant]);
  };

  const handleDamage = (id: string, amount: number) => {
    setCombatants(combatants.map(c => 
      c.id === id 
        ? { ...c, currentHP: Math.max(0, c.currentHP - amount) }
        : c
    ));
  };

  const handleHeal = (id: string, amount: number) => {
    setCombatants(combatants.map(c => 
      c.id === id 
        ? { ...c, currentHP: Math.min(c.maxHP, c.currentHP + amount) }
        : c
    ));
  };

  return (
    <div className="container">
      <h1>Combat Tracker</h1>
      
      <div className="quick-add-characters">
        <h3>Quick Add Characters</h3>
        <div className="character-buttons">
          {savedCharacters.map(character => (
            <button
              key={character.name}
              onClick={() => handleAddSavedCharacter(character)}
              className="character-button"
            >
              {character.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleAddCombatant} className="add-combatant-form">
        <input
          type="text"
          placeholder="Name"
          value={newCombatant.name}
          onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Initiative"
          value={newCombatant.initiative}
          onChange={(e) => setNewCombatant({ ...newCombatant, initiative: parseInt(e.target.value) || 0 })}
          required
        />
        <input
          type="number"
          placeholder="Max HP"
          value={newCombatant.maxHP}
          onChange={(e) => setNewCombatant({ ...newCombatant, maxHP: parseInt(e.target.value) || 0 })}
          required
        />
        <input
          type="number"
          placeholder="AC"
          value={newCombatant.ac}
          onChange={(e) => setNewCombatant({ ...newCombatant, ac: parseInt(e.target.value) || 0 })}
          required
        />
        <button type="submit">Add Combatant</button>
      </form>

      <div className="combat-tracker">
        <table>
          <thead>
            <tr>
              <th>Initiative</th>
              <th>Name</th>
              <th>HP</th>
              <th>AC</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {combatants
              .sort((a, b) => b.initiative - a.initiative)
              .map((combatant) => (
                <tr key={combatant.id}>
                  <td>{combatant.initiative}</td>
                  <td>{combatant.name}</td>
                  <td>{combatant.currentHP} / {combatant.maxHP}</td>
                  <td>{combatant.ac}</td>
                  <td>
                    <button onClick={() => handleDamage(combatant.id, 1)} className="damage-btn">-1 HP</button>
                    <button onClick={() => handleHeal(combatant.id, 1)} className="heal-btn">+1 HP</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}