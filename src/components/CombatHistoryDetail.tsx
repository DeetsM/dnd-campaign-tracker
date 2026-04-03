import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useCombat } from '../context/CombatContext';
import { CombatLog } from './CombatLog';
import { StatSummary } from './StatSummary';

interface Combatant {
  id: string;
  name: string;
  currentHP: number;
  maxHP: number;
  ac: number;
  initiative: number;
  type: string;
}

function getDisplayName(combatant: Combatant, allCombatants: Combatant[]): string {
  const sameNameCombatants = allCombatants.filter(c => c.name === combatant.name);
  if (sameNameCombatants.length > 1) {
    const index = sameNameCombatants.findIndex(c => c.id === combatant.id);
    return `${combatant.name} (${index + 1})`;
  }
  return combatant.name;
}

export function CombatHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCombatDetails, updateCombatTitle, deleteCombat, updateCombatStats } = useCombat();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editStatsOpen, setEditStatsOpen] = useState(false);
  const [editedStats, setEditedStats] = useState<Record<string, any>>({});
  const combat = getCombatDetails(id || '');

  const handleDeleteConfirm = () => {
    if (combat) {
      deleteCombat(combat.id);
      setDeleteConfirmOpen(false);
      navigate('/history');
    }
  };

  const handleEditStats = () => {
    if (combat) {
      setEditedStats(JSON.parse(JSON.stringify(combat.stats)));
      setEditStatsOpen(true);
    }
  };

  const handleSaveStats = () => {
    if (combat) {
      updateCombatStats(combat.id, editedStats as any);
      setEditStatsOpen(false);
    }
  };

  const handleStatChange = (statCategory: string, name: string, value: string) => {
    setEditedStats(prev => ({
      ...prev,
      [statCategory]: {
        ...prev[statCategory],
        [name]: value === '' ? 0 : parseInt(value) || 0
      }
    }));
  };

  const handleAddNewStat = (statCategory: string) => {
    const newStatName = prompt(`Enter new ${statCategory} stat name (e.g., "Ranger"):`);
    if (newStatName && newStatName.trim()) {
      setEditedStats(prev => ({
        ...prev,
        [statCategory]: {
          ...prev[statCategory],
          [newStatName.trim()]: 0
        }
      }));
    }
  };

  if (!combat) {
    return (
      <div className="container mx-auto p-4">
        <Typography>Combat not found.</Typography>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/history')}
          className="mt-4"
        >
          Back to History
        </Button>
      </div>
    );
  }



  return (
    <div className="container mx-auto p-4">
      <Box className="flex items-center gap-4 mb-6">
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
        <Box className="flex-grow">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-4">
              <Typography variant="h4" className="flex-grow">
                {combat.title}
                <IconButton
                  size="small"
                  onClick={() => {
                    const newTitle = prompt('Enter new title:', combat.title);
                    if (newTitle && newTitle.trim() !== '') {
                      updateCombatTitle(combat.id, newTitle.trim());
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Typography>
            </Box>
            <IconButton
              color="error"
              onClick={() => setDeleteConfirmOpen(true)}
              title="Delete combat"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            {new Date(combat.date).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Paper className="p-4">
          <Typography variant="h6" className="mb-2">Overview</Typography>
          <Typography>Date: {new Date(combat.date).toLocaleDateString()}</Typography>
          <Typography>Total Rounds: {combat.rounds}</Typography>
          <Typography>Combatants: {combat.combatants.length}</Typography>
          <Box className="mt-2">
            <Typography variant="subtitle2">Players:</Typography>
            <Box className="flex flex-wrap gap-1">
              {combat.combatants
                .filter(c => c.type === 'player')
                .map(c => (
                  <Chip
                    key={c.id}
                    label={getDisplayName(c, combat.combatants)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
            </Box>
          </Box>
          <Box className="mt-2">
            <Typography variant="subtitle2">Allies:</Typography>
            <Box className="flex flex-wrap gap-1">
              {combat.combatants
                .filter(c => c.type === 'ally')
                .map(c => (
                  <Chip
                    key={c.id}
                    label={getDisplayName(c, combat.combatants)}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ))}
            </Box>
            {combat.combatants.filter(c => c.type === 'ally').length === 0 && (
              <Typography variant="body2" color="text.secondary">None</Typography>
            )}
          </Box>
          <Box className="mt-2">
            <Typography variant="subtitle2">Enemies:</Typography>
            <Box className="flex flex-wrap gap-1">
              {combat.combatants
                .filter(c => c.type === 'enemy')
                .map(c => (
                  <Chip
                    key={c.id}
                    label={getDisplayName(c, combat.combatants)}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                ))}
            </Box>
            {combat.combatants.filter(c => c.type === 'enemy').length === 0 && (
              <Typography variant="body2" color="text.secondary">None</Typography>
            )}
          </Box>
        </Paper>

        <Paper className="p-4">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6">Combat Statistics</Typography>
            <IconButton
              size="small"
              onClick={handleEditStats}
              title="Edit stats"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          <StatSummary combat={combat} />
        </Paper>
      </Box>

      <Paper className="p-4 mb-6">
        <Typography variant="h6" className="mb-2">Combatants</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="text-white">Name</TableCell>
                <TableCell align="center" className="text-white">Initiative</TableCell>
                <TableCell align="center" className="text-white">HP</TableCell>
                <TableCell align="center" className="text-white">AC</TableCell>
                <TableCell align="center" className="text-white">Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combat.combatants.map((combatant) => (
                <TableRow key={combatant.id}>
                  <TableCell>{getDisplayName(combatant, combat.combatants)}</TableCell>
                  <TableCell align="center">{combatant.initiative}</TableCell>
                  <TableCell align="center">{combatant.currentHP} / {combatant.maxHP}</TableCell>
                  <TableCell align="center">{combatant.ac}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        combatant.type === 'player' 
                          ? 'Player'
                          : combatant.type === 'ally'
                          ? 'Ally'
                          : combatant.type === 'enemy'
                          ? 'Enemy'
                          : 'Neutral'
                      }
                      color={
                        combatant.type === 'player'
                          ? 'primary'
                          : combatant.type === 'ally'
                          ? 'success'
                          : combatant.type === 'enemy'
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper className="p-4">
        <Typography variant="h6" className="mb-2">Combat Log</Typography>
        <CombatLog entries={combat.logEntries} />
      </Paper>

      <Dialog
        open={editStatsOpen}
        onClose={() => setEditStatsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Combat Statistics</DialogTitle>
        <DialogContent className="overflow-y-auto max-h-[70vh]">
          <Box className="mt-4 space-y-6">
            {Object.entries(editedStats).map(([category, stats]: [string, any]) => (
              <Box key={category} className="p-4 border border-gray-300 rounded">
                <Box className="flex items-center justify-between" sx={{ '& > *': { mb: 1} }}>
                  <Typography variant="subtitle1" className="font-bold capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleAddNewStat(category)}
                  >
                    Add Entry
                  </Button>
                </Box>
                <Box className="flex justify-between flex-wrap" sx={{ '& > *': { mt: 1, mb: 1, mr: 1} }}>
                  {Object.entries(stats || {}).map(([name, value]: [string, any]) => (
                    <TextField
                      key={`${category}-${name}`}
                      label={name}
                      type="number"
                      size="small"
                      value={value || 0}
                      onChange={(e) => handleStatChange(category, name, e.target.value)}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditStatsOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveStats} color="primary" variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Combat Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{combat.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}