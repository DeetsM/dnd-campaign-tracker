import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { CombatTracker } from './components/CombatTracker'
import { CharacterRoster } from './components/CharacterRoster'
import { CharacterStats } from './components/CharacterStats'
import { NPCRoster } from './components/NPCRoster'
import { CombatHistory } from './components/CombatHistory'
import { CombatHistoryDetail } from './components/CombatHistoryDetail'
import './App.css'

import { CombatProvider } from './context/CombatContext';

function App() {
  return (
    <Router>
      <CombatProvider>
        <div className="app">
          <nav className="nav-bar">
            <Link to="/" className="nav-link">Combat</Link>
            <Link to="/roster" className="nav-link">Character Roster</Link>
            <Link to="/stats" className="nav-link">Character Stats</Link>
            <Link to="/npc-roster" className="nav-link">NPC Management</Link>
            <Link to="/history" className="nav-link">Combat History</Link>
          </nav>

        <Routes>
          <Route path="/" element={<CombatTracker />} />
          <Route path="/player-view" element={<CombatTracker isPlayerView={true} />} />
          <Route path="/roster" element={<CharacterRoster />} />
          <Route path="/stats" element={<CharacterStats />} />
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
