import { useState, FormEvent } from 'react'
import { Character } from '../types'
import { CombatPhase } from './CombatPhase'
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
  savedCharacters: Character[];
}

interface Combatant extends Character {
  id: string;
  currentHP: number;
  initiative: number; // Required once combat starts
  isPlayer: boolean;
  conditions?: string[]; // Add support for conditions
}

type CombatPhase = 'setup' | 'active';

export function CombatTracker({ savedCharacters }: CombatTrackerProps) {
  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    maxHP: 0,
    ac: 10,
    isPlayer: false,
  });

  const handleAddCombatant = (e: FormEvent) => {
    e.preventDefault();
    const combatant: Omit<Combatant, 'initiative'> = {
      id: Date.now().toString(),
      name: newCombatant.name,
      currentHP: newCombatant.maxHP,
      maxHP: newCombatant.maxHP,
      ac: newCombatant.ac,
      isPlayer: newCombatant.isPlayer,
    };
    // During setup, we use a type assertion since initiative will be set later
    setCombatants([...combatants, { ...combatant, initiative: 0 } as Combatant]);
    setNewCombatant({ name: '', maxHP: 0, ac: 10, isPlayer: false });
  };

  const handleAddSavedCharacter = (character: Character) => {
    const combatant: Combatant = {
      ...character,
      id: Date.now().toString(),
      currentHP: character.maxHP,
      isPlayer: true,
      initiative: 0 // Initial initiative value
    };
    setCombatants([...combatants, combatant]);
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants(combatants.filter(c => c.id !== id));
  };

  const handleRollInitiative = (id: string) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const combatant = combatants.find(c => c.id === id);
    if (combatant) {
      setCombatants(combatants.map(c => 
        c.id === id 
          ? { ...c, initiative: roll + (c.initiative || 0) }
          : c
      ));
    }
  };

  const handleSetInitiative = (id: string, value: number) => {
    setCombatants(combatants.map(c => 
      c.id === id 
        ? { ...c, initiative: value }
        : c
    ));
  };

  const allInitiativesSet = combatants.length > 0 && combatants.every(c => typeof c.initiative === 'number');

  const handleStartCombat = () => {
    // Ensure all combatants have initiatives
    const validCombatants = combatants.map(c => ({
      ...c,
      initiative: c.initiative || 0 // Default to 0 if not set
    }));
    setCombatants(validCombatants);
    setPhase('active');
  };

  const handleUpdateCombatant = (id: string, updates: Partial<Combatant>) => {
    // Get the current combatant to ensure we have the latest state
    const currentCombatant = combatants.find(c => c.id === id);
    if (!currentCombatant) {
      return;
    }
    
    // Create the updated combatant with both current state and updates
    const updatedCombatant = {
      ...currentCombatant,
      ...updates,
    };

    // Force a state update with a new array reference
    setCombatants(prev => prev.map(c => 
      c.id === id ? updatedCombatant : c
    ));
  };

  const handleEndCombat = () => {
    if (window.confirm('Are you sure you want to end combat? This will reset all combatants.')) {
      setPhase('setup');
      // Reset combatants to full HP and set initiative to 0
      setCombatants(combatants.map(c => ({
        ...c,
        currentHP: c.maxHP,
        initiative: 0 // Set to 0 instead of undefined
      })));
    }
  };

  const handleAddCombatantDuringCombat = (newCombatant: Omit<Combatant, 'id'>) => {
    const combatant: Combatant = {
      ...newCombatant,
      id: Date.now().toString(),
      currentHP: newCombatant.maxHP, // Initialize at max HP
    };
    setCombatants([...combatants, combatant]);
  };

  if (phase === 'active') {
    return (
      <CombatPhase
        combatants={combatants}
        onUpdateCombatant={handleUpdateCombatant}
        onAddCombatant={handleAddCombatantDuringCombat}
        onEndCombat={handleEndCombat}
      />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h4" className="mb-6 text-center">
        Combat Setup
      </Typography>

      <Paper className="p-4 mb-6">
        <Typography variant="h6" className="mb-3">
          Quick Add Players
        </Typography>
        <Box className="flex flex-wrap gap-2">
          {savedCharacters.map(character => (
            <Chip
              key={character.name}
              label={character.name}
              onClick={() => handleAddSavedCharacter(character)}
              icon={<PersonAddIcon />}
              color="primary"
              variant="outlined"
              className="cursor-pointer"
            />
          ))}
        </Box>
      </Paper>

      <Paper className="p-6 mb-6">
        <Typography variant="h6" className="mb-4">
          Add New Combatant
        </Typography>
        <form onSubmit={handleAddCombatant} className="flex flex-wrap gap-4">
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
            label="AC"
            value={newCombatant.ac}
            onChange={(e) => setNewCombatant({ ...newCombatant, ac: parseInt(e.target.value) || 10 })}
            required
            size="small"
            className="flex-1 min-w-[150px]"
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<PersonAddIcon />}
            className="w-full sm:w-auto"
          >
            Add Combatant
          </Button>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell>Name</TableCell>
              <TableCell align="center">Initiative</TableCell>
              <TableCell align="center">HP</TableCell>
              <TableCell align="center">AC</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {combatants
              .sort((a, b) => (b.initiative || 0) - (a.initiative || 0))
              .map((combatant) => (
                <TableRow 
                  key={combatant.id}
                  className={combatant.isPlayer ? 'bg-blue-50' : ''}
                >
                  <TableCell>{combatant.name}</TableCell>
                  <TableCell align="center">
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

      {combatants.length > 0 && (
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