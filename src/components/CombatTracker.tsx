import { useState, FormEvent, useEffect } from 'react'
import { Character } from '../types'
import { CharacterService, StoredCharacter } from '../services/characterService'
import { NPCService, StoredNPC } from '../services/npcService'
import { CombatPhase } from './CombatPhase'
import { useCombat } from '../context/CombatContext'
import {
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Chip,
  Fab,
} from '@mui/material'
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Casino as DiceIcon,
} from '@mui/icons-material'

interface CombatTrackerProps {
  savedCharacters?: Character[];
  isPlayerView?: boolean;
}

interface Combatant extends Character {
  id: string;
  currentHP: number;
  tempHP: number;
  initiative: number; // Required once combat starts
  type: 'player' | 'ally' | 'enemy' | 'neutral';
  conditions?: string[]; // Add support for conditions
}

type CombatPhase = 'setup' | 'active';

function getDisplayName(combatant: Combatant, allCombatants: Combatant[]): string {
  const sameNameCombatants = allCombatants.filter(c => c.name === combatant.name);
  if (sameNameCombatants.length > 1) {
    const index = sameNameCombatants.findIndex(c => c.id === combatant.id);
    return `${combatant.name} (${index + 1})`;
  }
  return combatant.name;
}

export function CombatTracker({ isPlayerView = false }: CombatTrackerProps) {
  const { combatState, updateCombatState, addCombatant: addCombatantToContext, updateCombatant, removeCombatant } = useCombat();
  const { phase, combatants } = combatState;
  const [characters, setCharacters] = useState<StoredCharacter[]>([]);
  const [npcs, setNpcs] = useState<StoredNPC[]>([]);
  const [enemySearchQuery, setEnemySearchQuery] = useState('');
  const [newCombatant, setNewCombatant] = useState<{
    name: string;
    maxHP: number;
    currentHP: number;
    ac: number;
    type: 'player' | 'ally' | 'enemy' | 'neutral';
  }>({
    name: '',
    maxHP: 0,
    currentHP: 0,
    ac: 10,
    type: 'enemy',
  });
  const [combatTitle, setCombatTitle] = useState('Combat Encounter');

  // Load characters and NPCs from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedCharacters, enemies, allies] = await Promise.all([
          CharacterService.getAll(),
          NPCService.getEnemies(),
          NPCService.getAllies()
        ]);
        setCharacters(loadedCharacters);
        setNpcs([...enemies, ...allies]);
      } catch (error) {
        console.error('Error loading characters and NPCs:', error);
      }
    };

    loadData();
  }, []);

  const handleAddCombatant = (e: FormEvent) => {
    e.preventDefault();
    const combatant: Omit<Combatant, 'id'> = {
      name: newCombatant.name,
      currentHP: newCombatant.currentHP || newCombatant.maxHP,
      maxHP: newCombatant.maxHP,
      ac: newCombatant.ac,
      type: newCombatant.type,
      tempHP: 0,
      initiative: 0,
    };
    addCombatantToContext(combatant);
    setNewCombatant({ name: '', maxHP: 0, currentHP: 0, ac: 10, type: 'enemy' });
  };

  const handleAddSavedCharacter = (character: Character) => {
    const combatant: Omit<Combatant, 'id'> = {
      ...character,
      currentHP: character.maxHP,
      type: 'player',
      initiative: 0,
      tempHP: 0,
    };
    addCombatantToContext(combatant);
  };

  const handleAddNPC = (npc: StoredNPC) => {
    const combatant: Omit<Combatant, 'id'> = {
      name: npc.name,
      maxHP: npc.maxHP,
      ac: npc.ac,
      initiative: npc.initiative || 0,
      currentHP: npc.maxHP,
      type: npc.type as 'enemy' | 'ally',
      tempHP: 0,
    };
    addCombatantToContext(combatant);
  };

  const handleRemoveCombatant = (id: string) => {
    removeCombatant(id);
  };

  const handleRollInitiative = (id: string) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const combatant = combatants.find(c => c.id === id);
    if (combatant) {
      updateCombatant(id, { initiative: roll + (combatant.initiative || 0) });
    }
  };

  const handleSetInitiative = (id: string, value: number) => {
    updateCombatant(id, { initiative: value });
  };

  const allInitiativesSet = combatants.length > 0 && combatants.every(c => typeof c.initiative === 'number');

  const handleStartCombat = () => {
    // Ensure all combatants have initiatives
    combatants.forEach(c => {
      if (!c.initiative) {
        updateCombatant(c.id, { initiative: 0 });
      }
    });
    updateCombatState({ phase: 'active' });
  };

  const { endCombat } = useCombat();

  const handleEndCombat = () => {
    if (window.confirm('Are you sure you want to end combat? This will be saved to combat history.')) {
      endCombat(combatTitle);
    }
  };

  const handleAddCombatantDuringCombat = (combatant: Omit<Combatant, 'id'>) => {
    addCombatantToContext(combatant);
  };

  if (phase === 'active') {
    return (
      <CombatPhase
        combatants={combatants}
        onUpdateCombatant={updateCombatant}
        onAddCombatant={handleAddCombatantDuringCombat}
        onEndCombat={handleEndCombat}
        isPlayerView={isPlayerView}
        title={combatTitle}
        onTitleChange={setCombatTitle}
      />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h4" className="mb-6 text-center">
        {isPlayerView ? 'Waiting for Combat to Start...' : 'Combat Setup'}
      </Typography>
      
      {isPlayerView && (
        <Paper className="p-6 text-center">
          <Typography variant="body1" color="text.secondary">
            The Dungeon Master is preparing the combat encounter...
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            This page will update automatically when combat begins.
          </Typography>
        </Paper>
      )}

      {!isPlayerView && (
        <>
          <Paper className="p-4 mb-6">
            <Typography variant="h6" className="mb-3">
              Quick Add Players
            </Typography>
            <Box className="flex flex-wrap gap-2">
              {characters.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No characters created yet. Add some in Character Roster.
                </Typography>
              ) : (
                characters.map(character => (
                  <Chip
                    key={character.id}
                    label={character.name}
                    onClick={() => handleAddSavedCharacter(character)}
                    icon={<PersonAddIcon />}
                    color="primary"
                    variant="outlined"
                    className="cursor-pointer"
                  />
                ))
              )}
            </Box>
          </Paper>

          <Paper className="p-4 mb-6">
            <Typography variant="h6" className="mb-3">
              Quick Add Allies
            </Typography>
            <Box className="flex flex-wrap gap-2">
              {npcs.filter(npc => npc.type === 'ally').length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No allies created yet. Add some in NPC Management.
                </Typography>
              ) : (
                npcs
                  .filter(npc => npc.type === 'ally')
                  .map(npc => (
                    <Chip
                      key={npc.id}
                      label={npc.name}
                      onClick={() => handleAddNPC(npc)}
                      icon={<PersonAddIcon />}
                      color="success"
                      variant="outlined"
                      className="cursor-pointer"
                    />
                  ))
              )}
            </Box>
          </Paper>

          <Paper className="p-4 mb-6">
            <Typography variant="h6" className="mb-3">
              Quick Add Enemies
            </Typography>
            <Box className="mb-3">
              <TextField
                fullWidth
                placeholder="Search enemies..."
                size="small"
                value={enemySearchQuery}
                onChange={(e) => setEnemySearchQuery(e.target.value)}
              />
            </Box>
            <Box className="flex flex-wrap gap-2">
              {npcs.filter(npc => npc.type === 'enemy').length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No enemies created yet. Add some in NPC Management.
                </Typography>
              ) : (
                npcs
                  .filter(npc => npc.type === 'enemy' && npc.name.toLowerCase().includes(enemySearchQuery.toLowerCase()))
                  .map(npc => (
                    <Chip
                      key={npc.id}
                      label={npc.name}
                      onClick={() => handleAddNPC(npc)}
                      icon={<PersonAddIcon />}
                      color="error"
                      variant="outlined"
                      className="cursor-pointer"
                    />
                  ))
              )}
            </Box>
            {npcs.filter(npc => npc.type === 'enemy' && npc.name.toLowerCase().includes(enemySearchQuery.toLowerCase())).length === 0 && enemySearchQuery && npcs.filter(npc => npc.type === 'enemy').length > 0 && (
              <Typography variant="body2" color="text.secondary" className="mt-2">
                No enemies match "{enemySearchQuery}"
              </Typography>
            )}
          </Paper>

          <Paper className="p-6 mb-6">
            <Typography variant="h6" className="mb-4">
              Add New Combatant
            </Typography>
            <form onSubmit={handleAddCombatant} className="flex flex-col gap-4">
              <Box className="flex flex-wrap gap-4">
                <TextField
                  label="Name"
                  value={newCombatant.name}
                  onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
                  required
                  size="small"
                  className="flex-1 min-w-[200px]"
                />
                <TextField
                  type="number"
                  label="Max HP"
                  value={newCombatant.maxHP}
                  onChange={(e) => setNewCombatant({ ...newCombatant, maxHP: parseInt(e.target.value) || 0 })}
                  required
                  size="small"
                  className="flex-1 min-w-[150px]"
                />
                <TextField
                  type="number"
                  label="Current HP"
                  value={newCombatant.currentHP}
                  onChange={(e) => setNewCombatant({ ...newCombatant, currentHP: Math.min(parseInt(e.target.value) || 0, newCombatant.maxHP) })}
                  size="small"
                  className="flex-1 min-w-[150px]"
                />
                <TextField
                  type="number"
                  label="AC"
                  value={newCombatant.ac}
                  onChange={(e) => setNewCombatant({ ...newCombatant, ac: parseInt(e.target.value) || 10 })}
                  required
                  size="small"
                  className="flex-1 min-w-[150px]"
                />
              </Box>
              <Box className="flex flex-col gap-2">
                <Typography variant="subtitle2">Type</Typography>
                <Box className="flex gap-2 flex-wrap">
                  {(['player', 'ally', 'enemy', 'neutral'] as const).map((typeOption) => (
                    <Chip
                      key={typeOption}
                      label={typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                      color={newCombatant.type === typeOption ? 'primary' : 'default'}
                      onClick={() => setNewCombatant(prev => ({ ...prev, type: typeOption }))}
                      clickable
                      variant={newCombatant.type === typeOption ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
              <Button
                type="submit"
                variant="contained"
                startIcon={<PersonAddIcon />}
              >
                Add Combatant
              </Button>
            </form>
          </Paper>
        </>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="text-white">Name</TableCell>
              <TableCell align="center" className="text-white">Initiative</TableCell>
              <TableCell align="center" className="text-white">HP</TableCell>
              <TableCell align="center" className="text-white">AC</TableCell>
              <TableCell align="center" className="text-white">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combatants
              .sort((a, b) => (b.initiative || 0) - (a.initiative || 0))
              .map((combatant) => (
                <TableRow 
                  key={combatant.id}
                  className={combatant.type === 'player' ? 'bg-blue-50' : ''}
                >
                  <TableCell>{getDisplayName(combatant, combatants)}</TableCell>
                  <TableCell align="center">
                    {isPlayerView ? (
                      <Typography>{combatant.initiative || 0}</Typography>
                    ) : (
                      <Box className="flex items-center justify-center gap-2">
                        <TextField
                          type="number"
                          size="small"
                          value={combatant.initiative || ''}
                          onChange={(e) => handleSetInitiative(combatant.id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <IconButton
                          onClick={() => handleRollInitiative(combatant.id)}
                          color="primary"
                          size="small"
                        >
                          <DiceIcon />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">{combatant.maxHP}</TableCell>
                  <TableCell align="center">{combatant.ac}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleRemoveCombatant(combatant.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {!isPlayerView && combatants.length > 0 && (
        <Box className="fixed bottom-8 right-8">
          <Fab
            color="primary"
            variant="extended"
            disabled={!allInitiativesSet}
            onClick={handleStartCombat}
          >
            <PlayArrowIcon sx={{ mr: 1 }} />
            Start Combat
          </Fab>
        </Box>
      )}
    </div>
  );
}