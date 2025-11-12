import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { CombatTracker } from './components/CombatTracker'
import { CharacterRoster } from './components/CharacterRoster'
import { NPCRoster } from './components/NPCRoster'
import { CombatHistory } from './components/CombatHistory'
import { CombatHistoryDetail } from './components/CombatHistoryDetail'
import { Character } from './types'
import './App.css'

import { CombatProvider } from './context/CombatContext';

function App() {
  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('savedCharacters');
    return saved ? JSON.parse(saved) : [];
  });

  // Save characters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedCharacters', JSON.stringify(characters));
  }, [characters]);

  const handleAddCharacter = (character: Character) => {
    if (!characters.some(c => c.name === character.name)) {
      setCharacters([...characters, character]);
    } else {
      alert('A character with this name already exists!');
    }
  };

  const handleUpdateCharacter = (oldName: string, updatedCharacter: Character) => {
    if (oldName !== updatedCharacter.name && characters.some(c => c.name === updatedCharacter.name)) {
      alert('A character with this name already exists!');
      return;
    }
    setCharacters(characters.map(c => 
      c.name === oldName ? updatedCharacter : c
    ));
  };

  const handleDeleteCharacter = (name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setCharacters(characters.filter(c => c.name !== name));
    }
  };

  return (
    <Router>
      <CombatProvider>
        <div className="app">
          <nav className="nav-bar">
            <Link to="/" className="nav-link">Combat</Link>
            <Link to="/roster" className="nav-link">Character Roster</Link>
            <Link to="/npc-roster" className="nav-link">NPC Management</Link>
            <Link to="/history" className="nav-link">Combat History</Link>
          </nav>

        <Routes>
          <Route path="/" element={<CombatTracker />} />
          <Route path="/player-view" element={<CombatTracker isPlayerView={true} />} />
          <Route 
            path="/roster" 
            element={
              <CharacterRoster 
                characters={characters} 
                onAddCharacter={handleAddCharacter}
                onUpdateCharacter={handleUpdateCharacter}
                onDeleteCharacter={handleDeleteCharacter}
              />
            } 
          />
          <Route path="/npc-roster" element={<NPCRoster />} />
          <Route path="/history" element={<CombatHistory />} />
          <Route path="/history/:id" element={<CombatHistoryDetail />} />
        </Routes>
      </div>
      </CombatProvider>
    </Router>
  )
}

export default App
