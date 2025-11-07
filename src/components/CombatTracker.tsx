import { useState, FormEvent, useEffect } from 'react'
import { Character } from '../types'
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
  savedCharacters: Character[];
  isPlayerView?: boolean;
}

interface Combatant extends Character {
  id: string;
  currentHP: number;
  tempHP: number;
  initiative: number; // Required once combat starts
  isPlayer: boolean;
  conditions?: string[]; // Add support for conditions
}

type CombatPhase = 'setup' | 'active';

export function CombatTracker({ savedCharacters, isPlayerView = false }: CombatTrackerProps) {
  const { combatState, updateCombatState, addCombatant: addCombatantToContext, updateCombatant, removeCombatant } = useCombat();
  const { phase, combatants } = combatState;
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    maxHP: 0,
    ac: 10,
    isPlayer: false,
  });

  const handleAddCombatant = (e: FormEvent) => {
    e.preventDefault();
    const combatant: Omit<Combatant, 'id'> = {
      name: newCombatant.name,
      currentHP: newCombatant.maxHP,
      maxHP: newCombatant.maxHP,
      ac: newCombatant.ac,
      isPlayer: newCombatant.isPlayer,
      tempHP: 0,
      initiative: 0,
    };
    addCombatantToContext(combatant);
    setNewCombatant({ name: '', maxHP: 0, ac: 10, isPlayer: false });
  };

  const handleAddSavedCharacter = (character: Character) => {
    const combatant: Omit<Combatant, 'id'> = {
      ...character,
      currentHP: character.maxHP,
      isPlayer: true,
      initiative: 0,
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
      endCombat();
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
                  className={combatant.isPlayer ? 'bg-blue-50' : ''}
                >
                  <TableCell>{combatant.name}</TableCell>
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