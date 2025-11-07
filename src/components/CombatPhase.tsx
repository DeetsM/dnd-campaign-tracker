import { useState } from 'react';
import { useCombat } from '../context/CombatContext';
import {
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  ArrowForward as NextTurnIcon,
  RemoveCircle as DamageIcon,
  AddCircle as HealIcon,
  AddCircle,
  RestartAlt as ResetIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import { CombatLog, CombatLogEntry } from './CombatLog';

interface Combatant {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  ac: number;
  initiative: number;
  isPlayer: boolean;
  conditions?: string[];
}

interface CombatPhaseProps {
  combatants: Combatant[];
  onUpdateCombatant: ((id: string, updates: Partial<Combatant>) => void) | undefined;
  onAddCombatant: ((combatant: Omit<Combatant, 'id'>) => void) | undefined;
  onEndCombat: (() => void) | undefined;
  isPlayerView?: boolean;
}

export function CombatPhase({ combatants, onUpdateCombatant, onAddCombatant, onEndCombat, isPlayerView = false }: CombatPhaseProps) {
  const { combatState, updateCombatState } = useCombat();
  const { currentTurn = 0, round = 1, logEntries = [] } = combatState;

  // Helper function to safely invoke callbacks
  const safeUpdate = (id: string, updates: Partial<Combatant>) => {
    if (onUpdateCombatant && !isPlayerView) {
      onUpdateCombatant(id, updates);
    }
  };

  const safeAddCombatant = (combatant: Omit<Combatant, 'id'>) => {
    if (onAddCombatant && !isPlayerView) {
      onAddCombatant(combatant);
    }
  };
  const [attackDialogOpen, setAttackDialogOpen] = useState(false);
  const [healDialogOpen, setHealDialogOpen] = useState(false);
  const [tempHPDialogOpen, setTempHPDialogOpen] = useState(false);
  const [tempHPAmount, setTempHPAmount] = useState('');
  const [selectedCombatants, setSelectedCombatants] = useState<string[]>([]);
  const [attackType, setAttackType] = useState<'attack' | 'save'>('attack');
  const [attackRoll, setAttackRoll] = useState('');
  const [saveType, setSaveType] = useState<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>('dex');
  const [savingThrowSuccesses, setSavingThrowSuccesses] = useState<string[]>([]);
  const [halfDamageOnSave, setHalfDamageOnSave] = useState(false);
  const [damageAmount, setDamageAmount] = useState('');
  const [healAmount, setHealAmount] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [attackStatus, setAttackStatus] = useState('');
  const [selectedCombatant, setSelectedCombatant] = useState<string | null>(null); // Keep for single-target status effects only
  const [attackResult, setAttackResult] = useState<'hit' | 'miss' | 'save' | 'fail' | null>(null);
  const [addCombatantDialogOpen, setAddCombatantDialogOpen] = useState(false);
  const [newCombatant, setNewCombatant] = useState<Omit<Combatant, 'id'>>({
    name: '',
    maxHP: 0,
    currentHP: 0,
    tempHP: 0,
    ac: 10,
    initiative: 0,
    isPlayer: false,
  });
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const addLogEntry = (text: string, type: CombatLogEntry['type']) => {
    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      text,
      type
    };
    updateCombatState(prev => {
      const currentEntries = prev.logEntries || [];
      // Check if an identical entry was added in the last second (helps prevent duplicates)
      const recentDuplicate = currentEntries[0] && 
        currentEntries[0].text === text && 
        currentEntries[0].type === type && 
        Date.now() - currentEntries[0].timestamp.getTime() < 1000;
      
      if (recentDuplicate) {
        return prev;
      }
      return {
        ...prev,
        logEntries: [newEntry, ...currentEntries]
      };
    });
  };

  const handleNextTurn = () => {
    if (currentTurn === sortedCombatants.length - 1) {
      updateCombatState({
        currentTurn: 0,
        round: round + 1
      });
      addLogEntry(`Round ${round + 1} begins`, 'round');
    } else {
      const nextTurn = currentTurn + 1;
      updateCombatState({ currentTurn: nextTurn });
      const nextCombatant = sortedCombatants[nextTurn];
      addLogEntry(`${nextCombatant.name}'s turn`, 'turn');
    }
  };

  const handleAttackConfirm = () => {
    if (selectedCombatants.length > 0) {
      // Find the combatant who is making the attack
      const attackerCombatant = combatants.find(c => c.id === selectedCombatant);
      const source = attackerCombatant || sortedCombatants[currentTurn];
      
      if (attackType === 'attack') {
        const roll = parseInt(attackRoll);
        const results = selectedCombatants
          .map(targetId => {
            const target = combatants.find(c => c.id === targetId);
            if (!target) return null;

            const hit = roll >= target.ac;
            let newHP = target.currentHP;
            
            if (hit && damageAmount) {
              const damage = parseInt(damageAmount);
              let remainingDamage = damage;
              // Apply damage to temp HP first
              if (target.tempHP > 0) {
                if (target.tempHP >= remainingDamage) {
                  remainingDamage = 0;
                } else {
                  remainingDamage -= target.tempHP;
                }
              }
              
              // Apply any remaining damage to regular HP
              newHP = Math.max(0, target.currentHP - remainingDamage);
            }

            return {
              id: targetId,
              name: target.name,
              success: hit,
              newHP,
              originalHP: target.currentHP,
              roll,
              conditions: target.conditions || []
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        const hits = results.filter(r => r.success);
        const misses = results.filter(r => !r.success);

        // Apply updates for all hits
        hits.forEach(result => {
          const currentTarget = combatants.find(c => c.id === result.id);
          if (!currentTarget) {
            return;
          }

          if (damageAmount) {
            const damage = parseInt(damageAmount);
            let remainingDamage = damage;
            let newTempHP = currentTarget.tempHP || 0;
            let newCurrentHP = currentTarget.currentHP;

            // First apply damage to temp HP if any exists
            if (newTempHP > 0) {
              if (newTempHP >= remainingDamage) {
                // Temp HP absorbs all damage
                newTempHP -= remainingDamage;
                remainingDamage = 0;
              } else {
                // Temp HP absorbs some damage
                remainingDamage -= newTempHP;
                newTempHP = 0;
              }
            }

            // Apply any remaining damage to regular HP
            if (remainingDamage > 0) {
              newCurrentHP = Math.max(0, newCurrentHP - remainingDamage);
            }

            safeUpdate(result.id, { 
              currentHP: newCurrentHP,
              tempHP: newTempHP
            });
            
            if (newCurrentHP === 0) {
              addLogEntry(`${result.name} falls unconscious!`, 'damage');
            }
          }
          
          if (attackStatus) {
            const newConditions = [...(currentTarget.conditions || []), attackStatus];
            safeUpdate(result.id, {
              conditions: newConditions
            });
          }
        });
        
        if (hits.length > 0) {
          setAttackResult('hit');
          const hitNames = hits.map(r => r.name).join(', ');
          const damageText = damageAmount ? ` for ${damageAmount} damage` : '';
          const statusText = attackStatus ? ` and applied ${attackStatus}` : '';
          addLogEntry(
            `${source.name} hit ${hitNames}${damageText}${statusText} (Attack: ${roll})`,
            'damage'
          );
        }

        if (misses.length > 0) {
          setAttackResult('miss');
          const missNames = misses.map(r => r.name).join(', ');
          addLogEntry(
            `${source.name} missed ${missNames} (Attack: ${roll})`,
            'damage'
          );
        }

      } else {
        // Handle saving throws using the selected successes
        const results = selectedCombatants
          .map(targetId => {
            const target = combatants.find(c => c.id === targetId);
            if (!target) return null;

            const saved = savingThrowSuccesses.includes(targetId);
            let newHP = target.currentHP;

            if (damageAmount) {
              const baseDamage = parseInt(damageAmount);
              const finalDamage = saved && halfDamageOnSave ? Math.floor(baseDamage / 2) : baseDamage;
              let remainingDamage = finalDamage;
              // Apply damage to temp HP first
              if (target.tempHP > 0) {
                if (target.tempHP >= remainingDamage) {
                  remainingDamage = 0;
                } else {
                  remainingDamage -= target.tempHP;
                }
              }
              
              // Apply any remaining damage to regular HP
              newHP = Math.max(0, target.currentHP - remainingDamage);
            }

            return {
              id: targetId,
              name: target.name,
              success: saved,
              newHP,
              originalHP: target.currentHP,
              conditions: target.conditions || []
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);
        
        const saves = results.filter(r => r.success);
        const fails = results.filter(r => !r.success);

        // Apply HP updates for all targets
        results.forEach(result => {
          if (damageAmount) {
            const target = combatants.find(c => c.id === result.id);
            if (target) {
              const baseDamage = parseInt(damageAmount);
              const finalDamage = result.success && halfDamageOnSave ? Math.floor(baseDamage / 2) : baseDamage;
              let remainingDamage = finalDamage;
              let newTempHP = target.tempHP || 0;
              let newCurrentHP = target.currentHP;

              // First apply damage to temp HP if any exists
              if (newTempHP > 0) {
                if (newTempHP >= remainingDamage) {
                  // Temp HP absorbs all damage
                  newTempHP -= remainingDamage;
                  remainingDamage = 0;
                } else {
                  // Temp HP absorbs some damage
                  remainingDamage -= newTempHP;
                  newTempHP = 0;
                }
              }

              // Apply any remaining damage to regular HP
              if (remainingDamage > 0) {
                newCurrentHP = Math.max(0, newCurrentHP - remainingDamage);
              }

              safeUpdate(result.id, {
                currentHP: newCurrentHP,
                tempHP: newTempHP
              });

              if (newCurrentHP === 0) {
                addLogEntry(`${result.name} falls unconscious!`, 'damage');
              }
            }
          }
          // Only apply status effects to those who failed their save
          if (!result.success && attackStatus) {
            safeUpdate(result.id, {
              conditions: [...result.conditions, attackStatus]
            });
          }
        });

        if (saves.length > 0) {
          setAttackResult('save');
          const saveNames = saves.map(r => r.name).join(', ');
          addLogEntry(
            `${saveNames} succeeded on their ${saveType.toUpperCase()} save${
              damageAmount && halfDamageOnSave ? ` (taking ${Math.floor(parseInt(damageAmount) / 2)} damage)` : ''
            }`,
            'damage'
          );
        }

        if (fails.length > 0) {
          setAttackResult('fail');
          const failNames = fails.map(r => r.name).join(', ');
          const damageText = damageAmount ? ` taking ${damageAmount} damage` : '';
          const statusText = attackStatus ? ` and gained ${attackStatus}` : '';
          addLogEntry(
            `${failNames} failed their ${saveType.toUpperCase()} save${damageText}${statusText}`,
            'damage'
          );
        }
      }
    }
    
    setAttackDialogOpen(false);
    setAttackResult(null);
  };

  const handleOpenHealDialog = () => {
    setHealDialogOpen(true);
    setHealAmount('');
    setSelectedCombatants([]);
  };

  const handleOpenTempHPDialog = () => {
    setTempHPDialogOpen(true);
    setTempHPAmount('');
    setSelectedCombatants([]);
  };

  const handleTempHPConfirm = () => {
    if (selectedCombatants.length > 0 && tempHPAmount) {
      const amount = parseInt(tempHPAmount);
      // Find the combatant who is granting temp HP
      const granterCombatant = combatants.find(c => c.id === selectedCombatant);
      const source = granterCombatant || sortedCombatants[currentTurn];
      
      selectedCombatants.forEach(targetId => {
        const target = combatants.find(c => c.id === targetId);
        if (target && amount > (target.tempHP || 0)) {
          safeUpdate(targetId, { tempHP: amount });
        }
      });

      const targetNames = selectedCombatants
        .map(id => combatants.find(c => c.id === id)?.name)
        .filter(Boolean);
      
      addLogEntry(
        `${source.name} granted ${amount} temporary HP to ${targetNames.join(', ')}`, 
        'healing'
      );
    }
    setTempHPDialogOpen(false);
  };

  const handleHealConfirm = () => {
    if (selectedCombatants.length > 0 && healAmount) {
      const amount = parseInt(healAmount);
      // Find the combatant who is doing the healing
      const healerCombatant = combatants.find(c => c.id === selectedCombatant);
      const source = healerCombatant || sortedCombatants[currentTurn];
      
      selectedCombatants.forEach(targetId => {
        const target = combatants.find(c => c.id === targetId);
        if (target) {
          const newHP = Math.min(target.maxHP, target.currentHP + amount);
          safeUpdate(targetId, {
            currentHP: newHP
          });
          if (target.currentHP === 0 && newHP > 0) {
            addLogEntry(`${target.name} is back on their feet!`, 'healing');
          }
        }
      });

      const targetNames = selectedCombatants
        .map(id => combatants.find(c => c.id === id)?.name)
        .filter(Boolean);
      
      addLogEntry(
        `${source.name} healed ${targetNames.join(', ')} for ${amount} HP`, 
        'healing'
      );
    }
    setHealDialogOpen(false);
  };

  const handleStatusConfirm = () => {
    if (selectedCombatant && newStatus.trim()) {
      const target = combatants.find(c => c.id === selectedCombatant);
      // Use the source combatant for the status effect
      const sourceCombatant = combatants.find(c => c.id === selectedCombatant);
      const source = sourceCombatant || sortedCombatants[currentTurn];
      if (target) {
        safeUpdate(selectedCombatant, {
          conditions: [...(target.conditions || []), newStatus.trim()]
        });
        addLogEntry(`${source.name} afflicted ${target.name} with ${newStatus.trim()}`, 'status');
      }
    }
    setStatusDialogOpen(false);
  };

  const handleAddCombatant = () => {
    if (
      newCombatant.name.trim() &&
      newCombatant.maxHP > 0 &&
      newCombatant.currentHP >= 0 &&
      newCombatant.ac > 0 &&
      newCombatant.initiative >= 0
    ) {
      safeAddCombatant(newCombatant);
      addLogEntry(`${newCombatant.name} joined the combat!`, 'round');
      setAddCombatantDialogOpen(false);
      // Reset form
      setNewCombatant({
        name: '',
        maxHP: 0,
        currentHP: 0,
        tempHP: 0,
        ac: 10,
        initiative: 0,
        isPlayer: false,
      });
    }
  };

  // Handle HP sync
  const handleMaxHPChange = (value: number) => {
    setNewCombatant(prev => ({
      ...prev,
      maxHP: value,
      currentHP: Math.min(prev.currentHP, value)
    }));
  };

  // Common status effects for autocomplete
  const commonStatuses = [
    'Blinded',
    'Charmed',
    'Deafened',
    'Frightened',
    'Grappled',
    'Incapacitated',
    'Invisible',
    'Paralyzed',
    'Petrified',
    'Poisoned',
    'Prone',
    'Restrained',
    'Stunned',
    'Unconscious'
  ];

  return (
    <div className="container mx-auto p-4">
      <Box className="mb-6">
        <Typography variant="h4">
          Combat Round {round}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-700">
              <TableCell className="text-white">Name</TableCell>
              <TableCell className="text-white">Initiative</TableCell>
              <TableCell align="center" className="text-white">HP</TableCell>
              <TableCell align="center" className="text-white">Temp HP</TableCell>
              <TableCell align="center" className="text-white">AC</TableCell>
              <TableCell align="center" className="text-white">Status Effects</TableCell>
              {!isPlayerView && <TableCell align="center" className="text-white">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCombatants.map((combatant, index) => (
              <TableRow 
                key={combatant.id}
                className={`
                  ${combatant.isPlayer ? 'bg-blue-50' : ''}
                  ${index === currentTurn ? 'bg-yellow-100' : ''}
                  ${combatant.currentHP === 0 ? 'bg-red-100' : ''}
                `}
              >
                <TableCell>
                  <Box className="flex items-center gap-2">
                    {index === currentTurn && (
                      <NextTurnIcon fontSize="small" className="text-yellow-500" />
                    )}
                    <Typography variant="body1" className="font-medium">
                      {combatant.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{combatant.initiative}</TableCell>
                <TableCell align="center">
                    <Box 
                      className={!isPlayerView ? "cursor-pointer hover:bg-gray-100 rounded p-1" : "p-1"}
                      onClick={!isPlayerView ? () => {
                        const newCurrentHP = prompt(
                          `Enter new current HP for ${combatant.name} (max: ${combatant.maxHP}):`,
                          combatant.currentHP.toString()
                        );
                        if (newCurrentHP !== null) {
                          const hp = Math.min(Math.max(0, parseInt(newCurrentHP) || 0), combatant.maxHP);
                          safeUpdate(combatant.id, { currentHP: hp });
                          addLogEntry(`${combatant.name}'s current HP set to ${hp}`, 'status');
                        }
                      } : undefined}
                    >
                      <Box className={`
                        flex justify-center items-center gap-2 font-bold
                        ${combatant.currentHP < combatant.maxHP / 2 ? 'text-orange-600' : ''}
                        ${combatant.currentHP === 0 ? 'text-red-600' : 'text-green-600'}
                      `}>
                        {combatant.currentHP} / {combatant.maxHP}
                      </Box>
                    </Box>
                </TableCell>
                <TableCell align="center">
                    <Box 
                      className={!isPlayerView ? "cursor-pointer hover:bg-gray-100 rounded p-1" : "p-1"}
                      onClick={!isPlayerView ? () => {
                        const newTempHP = prompt(
                          `Enter new temporary HP for ${combatant.name}:`,
                          (combatant.tempHP || 0).toString()
                        );
                        if (newTempHP !== null) {
                          const hp = Math.max(0, parseInt(newTempHP) || 0);
                          safeUpdate(combatant.id, { tempHP: hp });
                          addLogEntry(
                            hp > 0 
                              ? `${combatant.name} gained ${hp} temporary HP`
                              : `${combatant.name}'s temporary HP was removed`,
                            'healing'
                          );
                        }
                      } : undefined}
                    >
                      <Typography 
                        className={`font-bold ${(combatant.tempHP || 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        {combatant.tempHP || 0}
                      </Typography>
                    </Box>
                </TableCell>
                <TableCell align="center">{combatant.ac}</TableCell>
                <TableCell align="center">
                  {combatant.conditions && combatant.conditions.length > 0 ? (
                    <Box className="flex gap-1 flex-wrap justify-center">
                      {combatant.conditions.map((condition) => (
                        <Chip
                          key={condition}
                          label={condition}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          onDelete={!isPlayerView ? () => {
                            safeUpdate(combatant.id, {
                              conditions: combatant.conditions?.filter(c => c !== condition)
                            });
                            const source = sortedCombatants[currentTurn];
                            addLogEntry(`${source.name} removed ${condition} from ${combatant.name}`, 'status');
                          } : undefined}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {!isPlayerView && (
                    <Box className="flex justify-center gap-2">
                      <Tooltip title="Make Attack">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setAttackDialogOpen(true);
                            setAttackRoll('');
                            setDamageAmount('');
                            setSelectedCombatants([]);
                            setAttackStatus('');
                            setAttackResult(null);
                            setAttackType('attack');
                            setSavingThrowSuccesses([]);
                            setHalfDamageOnSave(false);
                            setSelectedCombatant(combatant.id); // Set source combatant
                          }}
                        >
                          <DamageIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Heal">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => {
                            setSelectedCombatant(combatant.id); // Set source combatant
                            handleOpenHealDialog();
                          }}
                        >
                          <HealIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Temporary HP">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => {
                            setSelectedCombatant(combatant.id); // Set source combatant
                            handleOpenTempHPDialog();
                          }}
                        >
                          <AddCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Status Effect">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => {
                            setSelectedCombatant(combatant.id);
                            setStatusDialogOpen(true);
                            setNewStatus('');
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Fixed action buttons */}
      {!isPlayerView && (
        <Box className="fixed bottom-8 right-8 flex gap-4 bg-white bg-opacity-90 p-2 rounded-lg shadow-lg">
          <Fab
            color="info"
            variant="extended"
            onClick={() => setAddCombatantDialogOpen(true)}
            size="medium"
          >
            <AddIcon sx={{ mr: 1 }} />
            Add Combatant
          </Fab>
          {onEndCombat && (
            <Fab
              color="secondary"
              variant="extended"
              onClick={onEndCombat}
              size="medium"
            >
              <ResetIcon sx={{ mr: 1 }} />
              End Combat
            </Fab>
          )}
          <Fab
            color="primary"
            variant="extended"
            onClick={handleNextTurn}
          >
            <NextTurnIcon sx={{ mr: 1 }} />
            Next Turn
          </Fab>
        </Box>
      )}

      <Dialog open={attackDialogOpen} onClose={() => setAttackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make an Attack</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4">
            <Autocomplete<Combatant, true>
              multiple
              value={selectedCombatants.map(id => combatants.find(c => c.id === id)).filter((c): c is Combatant => c !== undefined)}
              onChange={(_, newValue) => setSelectedCombatants(newValue.map(v => v.id))}
              options={combatants}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box className="flex justify-between w-full">
                    <span>{option.name}</span>
                    <span className="text-gray-500">
                      AC: {option.ac} | HP: {option.currentHP}/{option.maxHP}
                    </span>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Targets"
                  fullWidth
                  required
                  helperText="Select targets for the attack"
                />
              )}
            />
            
            <Box className="flex gap-4">
              <Button
                variant={attackType === 'attack' ? 'contained' : 'outlined'}
                onClick={() => setAttackType('attack')}
                fullWidth
              >
                Attack Roll
              </Button>
              <Button
                variant={attackType === 'save' ? 'contained' : 'outlined'}
                onClick={() => setAttackType('save')}
                fullWidth
              >
                Saving Throw
              </Button>
            </Box>

            {attackType === 'attack' ? (
              <TextField
                label="Attack Roll"
                type="number"
                fullWidth
                value={attackRoll}
                onChange={(e) => setAttackRoll(e.target.value)}
                required
                helperText="Enter total attack roll (with modifiers)"
              />
            ) : (
              <Box className="flex flex-col gap-4">
                <Box className="flex gap-2 mb-2">
                  {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={saveType === type ? 'contained' : 'outlined'}
                      onClick={() => setSaveType(type)}
                      size="small"
                    >
                      {type.toUpperCase()}
                    </Button>
                  ))}
                </Box>
                <Box className="flex items-center gap-2 mb-2">
                  <Typography variant="subtitle2" color="text.secondary">
                    Half damage on successful save?
                  </Typography>
                  <Chip
                    label={halfDamageOnSave ? "Yes" : "No"}
                    color={halfDamageOnSave ? "primary" : "default"}
                    onClick={() => setHalfDamageOnSave(prev => !prev)}
                    className="cursor-pointer"
                  />
                </Box>
                <Typography variant="subtitle2" color="text.secondary" className="mb-1">
                  Select targets that succeeded their save:
                </Typography>
                <Box className="flex gap-2 flex-wrap">
                  {selectedCombatants.map(targetId => {
                    const target = combatants.find(c => c.id === targetId);
                    if (!target) return null;
                    const succeeded = (savingThrowSuccesses || []).includes(targetId);
                    return (
                      <Chip
                        key={targetId}
                        label={target.name}
                        color={succeeded ? "success" : "default"}
                        onClick={() => {
                          setSavingThrowSuccesses(prev => {
                            const newSuccesses = prev || [];
                            if (succeeded) {
                              return newSuccesses.filter(id => id !== targetId);
                            } else {
                              return [...newSuccesses, targetId];
                            }
                          });
                        }}
                        className="cursor-pointer"
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <TextField
              label="Damage Amount"
              type="number"
              fullWidth
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              helperText="Optional - Only applied on hit/failed save"
            />

            <Autocomplete
              value={attackStatus}
              onChange={(_, newValue) => setAttackStatus(newValue || '')}
              options={commonStatuses}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Status Effect"
                  fullWidth
                  helperText="Optional - Only applied on hit/failed save"
                />
              )}
            />

            {attackResult && (
              <Box className={`p-2 rounded text-center font-bold ${
                attackResult === 'hit' || attackResult === 'fail' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {attackResult === 'hit' && 'Hit!'}
                {attackResult === 'miss' && 'Miss!'}
                {attackResult === 'save' && 'Target Saved!'}
                {attackResult === 'fail' && 'Save Failed!'}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttackDialogOpen(false)} variant="text">
            Cancel
          </Button>
          <Button 
            onClick={handleAttackConfirm} 
            variant="contained" 
            color="error" 
            startIcon={<DamageIcon />}
            disabled={
              selectedCombatants.length === 0 || 
              (attackType === 'attack' && !attackRoll)
            }
          >
            Make Attack
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={healDialogOpen} onClose={() => setHealDialogOpen(false)}>
        <DialogTitle>Apply Healing</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4">
            <Autocomplete<Combatant, true>
              multiple
              value={selectedCombatants.map(id => combatants.find(c => c.id === id)).filter((c): c is Combatant => c !== undefined)}
              onChange={(_, newValue) => setSelectedCombatants(newValue.map(v => v.id))}
              options={combatants}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box className="flex justify-between w-full">
                    <span>{option.name}</span>
                    <span className="text-gray-500">
                      HP: {option.currentHP}/{option.maxHP}
                    </span>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Targets"
                  fullWidth
                  required
                  helperText="Select multiple targets to heal"
                />
              )}
            />
            <TextField
              label="Healing Amount"
              type="number"
              fullWidth
              value={healAmount}
              onChange={(e) => setHealAmount(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHealDialogOpen(false)} variant="text">
            Cancel
          </Button>
          <Button 
            onClick={handleHealConfirm} 
            variant="contained" 
            color="success"
            startIcon={<HealIcon />}
            disabled={selectedCombatants.length === 0 || !healAmount}
          >
            Apply Healing
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={tempHPDialogOpen} onClose={() => setTempHPDialogOpen(false)}>
        <DialogTitle>Grant Temporary HP</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4">
            <Autocomplete<Combatant, true>
              multiple
              value={selectedCombatants.map(id => combatants.find(c => c.id === id)).filter((c): c is Combatant => c !== undefined)}
              onChange={(_, newValue) => setSelectedCombatants(newValue.map(v => v.id))}
              options={combatants}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box className="flex justify-between w-full">
                    <span>{option.name}</span>
                    <span className="text-gray-500">
                      Current Temp HP: {option.tempHP || 0}
                    </span>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Targets"
                  fullWidth
                  required
                  helperText="Select targets to grant temporary HP to"
                />
              )}
            />
            <TextField
              label="Temporary HP Amount"
              type="number"
              fullWidth
              value={tempHPAmount}
              onChange={(e) => setTempHPAmount(e.target.value)}
              required
              helperText="Higher amounts will replace existing temporary HP"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTempHPDialogOpen(false)} variant="text">
            Cancel
          </Button>
          <Button 
            onClick={handleTempHPConfirm} 
            variant="contained" 
            color="primary"
            startIcon={<AddCircle />}
            disabled={selectedCombatants.length === 0 || !tempHPAmount}
          >
            Grant Temp HP
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Add Status Effect</DialogTitle>
        <DialogContent>
          <Autocomplete
            value={newStatus}
            onChange={(_, newValue) => setNewStatus(newValue || '')}
            inputValue={newStatus}
            onInputChange={(_, newValue) => setNewStatus(newValue)}
            options={commonStatuses}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                margin="dense"
                label="Status Effect"
                fullWidth
                helperText="Choose from common effects or type a custom one"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} variant="text">
            Cancel
          </Button>
          <Button 
            onClick={handleStatusConfirm} 
            variant="contained" 
            color="info"
            startIcon={<AddIcon />}
            disabled={!newStatus.trim()}
          >
            Add Status
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addCombatantDialogOpen} onClose={() => setAddCombatantDialogOpen(false)}>
        <DialogTitle>Add New Combatant</DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4 pt-2">
            <TextField
              label="Name"
              fullWidth
              value={newCombatant.name}
              onChange={(e) => setNewCombatant(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              label="Maximum HP"
              type="number"
              fullWidth
              value={newCombatant.maxHP}
              onChange={(e) => handleMaxHPChange(parseInt(e.target.value) || 0)}
              required
            />
            <TextField
              label="Current HP"
              type="number"
              fullWidth
              value={newCombatant.currentHP}
              onChange={(e) => setNewCombatant(prev => ({ 
                ...prev, 
                currentHP: Math.min(parseInt(e.target.value) || 0, prev.maxHP)
              }))}
              required
            />
            <TextField
              label="Temporary HP"
              type="number"
              fullWidth
              value={newCombatant.tempHP}
              onChange={(e) => setNewCombatant(prev => ({ 
                ...prev, 
                tempHP: Math.max(0, parseInt(e.target.value) || 0)
              }))}
            />
            <TextField
              label="Armor Class"
              type="number"
              fullWidth
              value={newCombatant.ac}
              onChange={(e) => setNewCombatant(prev => ({ ...prev, ac: parseInt(e.target.value) || 0 }))}
              required
            />
            <TextField
              label="Initiative"
              type="number"
              fullWidth
              value={newCombatant.initiative}
              onChange={(e) => setNewCombatant(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
              required
            />
            <Box className="flex items-center gap-2">
              <Typography>Is Player Character?</Typography>
              <Chip
                label={newCombatant.isPlayer ? "Player" : "NPC"}
                color={newCombatant.isPlayer ? "primary" : "default"}
                onClick={() => setNewCombatant(prev => ({ ...prev, isPlayer: !prev.isPlayer }))}
                clickable
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCombatantDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCombatant}
            disabled={!newCombatant.name || newCombatant.maxHP <= 0 || newCombatant.ac <= 0}
          >
            Add to Combat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Combat log with bottom padding for fixed buttons */}
      <Box className="mt-4 mb-28">
        <CombatLog 
          entries={logEntries as CombatLogEntry[]} 
          onClearLog={() => {
            updateCombatState(prev => ({ ...prev, logEntries: [] }));
            // Also reset related state to prevent duplicate entries
            setAttackResult(null);
          }} 
        />
      </Box>
    </div>
  );
}