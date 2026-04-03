import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Autocomplete,
} from '@mui/material';
import { LocalFireDepartment as DamageIcon } from '@mui/icons-material';
import { Combatant } from '../types';

interface AttackDialogProps {
  open: boolean;
  onClose: () => void;
  onAttack: (options: {
    targets: string[];
    attackRoll?: number;
    saveDC?: number;
    saveType?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
    damage?: number;
    status?: string;
    weaponMastery?: string;
  }) => void;
  combatants: Combatant[];
  commonStatuses: string[];
}

function getDisplayName(combatant: Combatant, allCombatants: Combatant[]): string {
  const sameNameCombatants = allCombatants.filter(c => c.name === combatant.name);
  if (sameNameCombatants.length > 1) {
    const index = sameNameCombatants.findIndex(c => c.id === combatant.id);
    return `${combatant.name} (${index + 1})`;
  }
  return combatant.name;
}

export function AttackDialog({
  open,
  onClose,
  onAttack,
  combatants,
  commonStatuses,
}: AttackDialogProps) {
  // Dialog state
  const [selectedCombatants, setSelectedCombatants] = useState<string[]>([]);
  const [attackType, setAttackType] = useState<'attack' | 'save'>('attack');
  const [attackRoll, setAttackRoll] = useState('');
  const [saveType, setSaveType] = useState<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>('dex');
  const [saveDC, setSaveDC] = useState('');
  const [damageAmount, setDamageAmount] = useState('');
  const [attackStatus, setAttackStatus] = useState('');
  const [weaponMastery, setWeaponMastery] = useState('');

  const handleConfirm = () => {
    const options = {
      targets: selectedCombatants,
      ...(attackType === 'attack' ? {
        attackRoll: parseInt(attackRoll),
      } : {
        saveDC: parseInt(saveDC),
        saveType,
      }),
      ...(damageAmount ? { damage: parseInt(damageAmount) } : {}),
      ...(attackStatus ? { status: attackStatus } : {}),
      ...(weaponMastery ? { weaponMastery } : {}),
    };

    onAttack(options);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCombatants([]);
    setAttackRoll('');
    setSaveDC('');
    setDamageAmount('');
    setAttackStatus('');
    setWeaponMastery('');
    setAttackType('attack');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Make an Attack</DialogTitle>
      <DialogContent>
        <Box className="flex flex-col gap-4">
          <Autocomplete<Combatant, true>
            multiple
            value={selectedCombatants.map(id => combatants.find(c => c.id === id)).filter((c): c is Combatant => c !== undefined)}
            onChange={(_, newValue) => setSelectedCombatants(newValue.map(v => v.id))}
            options={combatants}
            getOptionLabel={(option) => getDisplayName(option, combatants)}
            renderOption={(props, option) => (
              <li {...props}>
                <Box className="flex justify-between w-full">
                  <span>{getDisplayName(option, combatants)}</span>
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
              <Box className="flex gap-2">
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
              <TextField
                label="Save DC"
                type="number"
                fullWidth
                value={saveDC}
                onChange={(e) => setSaveDC(e.target.value)}
                required
                helperText="Enter the saving throw DC"
              />
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

          <TextField
            label="Weapon Mastery Effect"
            fullWidth
            value={weaponMastery}
            onChange={(e) => setWeaponMastery(e.target.value)}
            placeholder="e.g., Cleave damage, Topple, Slow..."
            helperText="Optional - Additional weapon mastery effect to apply"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="text">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="error" 
          startIcon={<DamageIcon />}
          disabled={
            selectedCombatants.length === 0 || 
            (attackType === 'attack' && !attackRoll) ||
            (attackType === 'save' && !saveDC)
          }
        >
          Make Attack
        </Button>
      </DialogActions>
    </Dialog>
  );
}