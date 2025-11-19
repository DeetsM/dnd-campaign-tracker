import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Checkbox,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { CheckCircle as CheckIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { CombatService } from '../services/combatService';
import { CombatHistory } from '../context/CombatContext';

interface ImportedCombatData {
  title: string;
  date: Date;
  rounds: number;
  combatants: Array<{
    name: string;
    maxHP: number;
    currentHP: number;
    ac: number;
    type: 'player' | 'ally' | 'enemy' | 'neutral';
    tempHP?: number;
    initiative?: number;
    conditions?: string[];
  }>;
  stats: {
    hitsAgainst: { [key: string]: number };
    damageDealt?: { [key: string]: number };
    damageTaken?: { [key: string]: number };
    healingDone?: { [key: string]: number };
    healingReceived?: { [key: string]: number };
    hits?: { [key: string]: number };
    misses?: { [key: string]: number };
    missesAgainst?: { [key: string]: number };
    savingThrowsForced?: { [key: string]: number };
    savingThrowsMade?: { [key: string]: number };
    savingThrowsFailed?: { [key: string]: number };
    kills?: { [key: string]: number };
    knockouts?: { [key: string]: number };
  };
}

interface ParsedCombat {
  data: ImportedCombatData;
  valid: boolean;
  errors: string[];
}

interface CombatImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const validateCombat = (data: any): ParsedCombat => {
  const errors: string[] = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Missing or invalid title');
  }
  if (!data.date) {
    errors.push('Missing date');
  }
  if (data.rounds === undefined || typeof data.rounds !== 'number') {
    errors.push('Missing or invalid rounds');
  }
  if (!Array.isArray(data.combatants) || data.combatants.length === 0) {
    errors.push('Missing combatants array or empty');
  } else {
    data.combatants.forEach((c: any, idx: number) => {
      if (!c.name) errors.push(`Combatant ${idx}: Missing name`);
      if (c.maxHP === undefined || c.maxHP < 0) errors.push(`Combatant ${idx}: Invalid max HP`);
      if (c.currentHP === undefined || c.currentHP < 0) errors.push(`Combatant ${idx}: Invalid current HP`);
      if (c.ac === undefined || c.ac < 0) errors.push(`Combatant ${idx}: Invalid AC`);
    });
  }
  if (!data.stats || typeof data.stats !== 'object') {
    errors.push('Missing stats object');
  }

  return {
    data: {
      ...data,
      date: new Date(data.date),
    },
    valid: errors.length === 0,
    errors,
  };
};

export function CombatImportDialog({
  open,
  onClose,
}: CombatImportDialogProps) {
  // JSON import state
  const [jsonInput, setJsonInput] = useState('');
  const [parsedCombats, setParsedCombats] = useState<ParsedCombat[]>([]);
  const [selectedCombats, setSelectedCombats] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleParse = () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const combats = Array.isArray(parsed) ? parsed : [parsed];
      
      const validated = combats.map((c) => validateCombat(c));
      setParsedCombats(validated);
      
      // Auto-select all valid combats
      const validIndices = new Set(
        validated
          .map((c, idx) => (c.valid ? idx : -1))
          .filter((idx) => idx !== -1)
      );
      setSelectedCombats(validIndices);
    } catch (err) {
      setError(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const combatsToImport = Array.from(selectedCombats)
        .map((idx) => parsedCombats[idx])
        .filter((c) => c.valid)
        .map((c) => c.data);

      if (combatsToImport.length === 0) {
        setError('No valid combats selected for import');
        setLoading(false);
        return;
      }

      // Save each combat to the database
      const savedCombats: CombatHistory[] = [];
      for (const combatData of combatsToImport) {
        const combatId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Ensure combatants have IDs
        const combatantsWithIds = combatData.combatants.map((c, idx) => ({
          ...c,
          id: `${combatId}-${idx}`,
          tempHP: c.tempHP || 0,
          initiative: c.initiative || idx,
          conditions: c.conditions || [],
        }));

        // Ensure stats have all required fields
        const stats = {
          damageDealt: combatData.stats.damageDealt || {},
          damageTaken: combatData.stats.damageTaken || {},
          healingDone: combatData.stats.healingDone || {},
          healingReceived: combatData.stats.healingReceived || {},
          hits: combatData.stats.hits || {},
          misses: combatData.stats.misses || {},
          missesAgainst: combatData.stats.missesAgainst || {},
          hitsAgainst: combatData.stats.hitsAgainst || {},
          savingThrowsForced: combatData.stats.savingThrowsForced || {},
          savingThrowsMade: combatData.stats.savingThrowsMade || {},
          savingThrowsFailed: combatData.stats.savingThrowsFailed || {},
          kills: combatData.stats.kills || {},
          knockouts: combatData.stats.knockouts || {},
        };

        const combat: CombatHistory = {
          id: combatId,
          title: combatData.title,
          date: combatData.date,
          combatants: combatantsWithIds,
          logEntries: [],
          rounds: combatData.rounds,
          stats,
        };

        const saved = await CombatService.saveCombat(combat);
        if (saved) {
          savedCombats.push(saved);
        }
      }

      if (savedCombats.length === 0) {
        setError('Failed to save any combats');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      // Reset form and close
      setTimeout(() => {
        setJsonInput('');
        setParsedCombats([]);
        setSelectedCombats(new Set());
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(`Failed to import combats: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setJsonInput('');
    setParsedCombats([]);
    setSelectedCombats(new Set());
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Combat History</DialogTitle>
      <DialogContent>
        <Box className="flex flex-col gap-4">
          {success ? (
            <Alert icon={<CheckIcon />} severity="success">
              Successfully imported {selectedCombats.size} combat(s)!
            </Alert>
          ) : null}

          {error && <Alert severity="error">{error}</Alert>}

          {parsedCombats.length === 0 ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Paste JSON data for one or more combats. Expected format:
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>View JSON Example</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    className="p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto w-full"
                    component="pre"
                  >
                    {`{
  "title": "Battle vs Dragon",
  "date": "2025-11-17T10:30:00Z",
  "rounds": 5,
  "combatants": [
    {
      "name": "Fighter",
      "maxHP": 50,
      "currentHP": 35,
      "ac": 16,
      "type": "player",
      "tempHP": 0,
      "initiative": 3
    },
    {
      "name": "Dragon",
      "maxHP": 120,
      "currentHP": 60,
      "ac": 18,
      "type": "enemy"
    }
  ],
  "stats": {
    "damageDealt": { "Fighter": 85, "Dragon": 42 },
    "damageTaken": { "Fighter": 15, "Dragon": 60 },
    "healingDone": { "Fighter": 25 },
    "healingReceived": { "Fighter": 25 },
    "hits": { "Fighter": 7, "Dragon": 3 },
    "hitsAgainst": { "Fighter": 2, "Dragon": 1 },
    "misses": { "Fighter": 1, "Dragon": 2 },
    "missesAgainst": { "Fighter": 2, "Dragon": 1 },
    "savingThrowsForced": { "Fighter": 1 },
    "savingThrowsMade": { "Dragon": 1 },
    "savingThrowsFailed": { "Fighter": 1 },
    "kills": { "Fighter": 1 },
    "knockouts": { "Dragon": 1 }
  }
}`}
                  </Box>
                </AccordionDetails>
              </Accordion>

              <TextField
                label="Paste JSON data here"
                multiline
                rows={12}
                fullWidth
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                disabled={loading}
                placeholder='[{"title": ".."}] or {"title": ".."}'
                variant="outlined"
              />

              <Button
                onClick={handleParse}
                variant="contained"
                disabled={!jsonInput.trim() || loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Parse JSON'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="subtitle2">
                Found {parsedCombats.length} combat(s) ({parsedCombats.filter((c) => c.valid).length} valid)
              </Typography>

              <List>
                {parsedCombats.map((combat, i) => (
                  <ListItem key={i}>
                    <Checkbox
                      checked={selectedCombats.has(i)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedCombats);
                        if (e.target.checked) {
                          newSelected.add(i);
                        } else {
                          newSelected.delete(i);
                        }
                        setSelectedCombats(newSelected);
                      }}
                      disabled={!combat.valid || loading}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          color={combat.valid ? 'textPrimary' : 'error'}
                          className={combat.valid ? '' : 'line-through'}
                        >
                          {combat.data.title}
                        </Typography>
                      }
                      secondary={
                        !combat.valid && combat.errors.length > 0 ? (
                          <Box className="text-xs text-red-600 mt-1">
                            {combat.errors.map((err, i) => (
                              <div key={i}>• {err}</div>
                            ))}
                          </Box>
                        ) : null
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {parsedCombats.length > 0 ? 'Clear' : 'Cancel'}
        </Button>
        {parsedCombats.length > 0 && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={selectedCombats.size === 0 || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Import Selected'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
