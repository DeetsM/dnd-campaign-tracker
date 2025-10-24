import { useState, FormEvent } from 'react';
import { Character } from '../types';

interface CharacterRosterProps {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onUpdateCharacter: (oldName: string, updatedCharacter: Character) => void;
  onDeleteCharacter: (name: string) => void;
}

export function CharacterRoster({ 
  characters, 
  onAddCharacter, 
  onUpdateCharacter,
  onDeleteCharacter 
}: CharacterRosterProps) {
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  const [formCharacter, setFormCharacter] = useState<Character>({
    name: '',
    maxHP: 0,
    initiative: 0,
    ac: 10
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingCharacter) {
      onUpdateCharacter(editingCharacter, formCharacter);
      setEditingCharacter(null);
    } else {
      onAddCharacter(formCharacter);
    }
    setFormCharacter({ name: '', maxHP: 0, initiative: 0, ac: 10 });
  };

  const startEditing = (character: Character) => {
    setEditingCharacter(character.name);
    setFormCharacter(character);
  };

  const cancelEditing = () => {
    setEditingCharacter(null);
    setFormCharacter({ name: '', maxHP: 0, initiative: 0, ac: 10 });
  };

  return (
    <div className="container">
      <h1>Character Roster</h1>
      
      <form onSubmit={handleSubmit} className="add-character-form">
        <input
          type="text"
          placeholder="Character Name"
          value={formCharacter.name}
          onChange={(e) => setFormCharacter({ ...formCharacter, name: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Max HP"
          value={formCharacter.maxHP}
          onChange={(e) => setFormCharacter({ ...formCharacter, maxHP: parseInt(e.target.value) || 0 })}
          required
        />
        <input
          type="number"
          placeholder="AC"
          value={formCharacter.ac}
          onChange={(e) => setFormCharacter({ ...formCharacter, ac: parseInt(e.target.value) || 10 })}
          required
        />
        <input
          type="number"
          placeholder="Initiative Modifier"
          value={formCharacter.initiative}
          onChange={(e) => setFormCharacter({ ...formCharacter, initiative: parseInt(e.target.value) || 0 })}
          required
        />
        <div className="form-buttons">
          <button type="submit">{editingCharacter ? 'Save Changes' : 'Add Character'}</button>
          {editingCharacter && (
            <button type="button" onClick={cancelEditing} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="character-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Max HP</th>
              <th>AC</th>
              <th>Initiative Modifier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((character) => (
              <tr key={character.name} className={editingCharacter === character.name ? 'editing' : ''}>
                <td>{character.name}</td>
                <td>{character.maxHP}</td>
                <td>{character.ac}</td>
                <td>{character.initiative}</td>
                <td>
                  {editingCharacter !== character.name ? (
                    <>
                      <button
                        onClick={() => startEditing(character)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteCharacter(character.name)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="editing-text">Editing...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}