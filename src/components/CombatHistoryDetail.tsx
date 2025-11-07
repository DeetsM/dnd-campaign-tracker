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
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useCombat } from '../context/CombatContext';
import { CombatLog } from './CombatLog';
import { StatSummary } from './StatSummary';

export function CombatHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCombatDetails, updateCombatTitle } = useCombat();
  const combat = getCombatDetails(id || '');

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
          <Typography variant="subtitle1" color="text.secondary">
            {new Date(combat.date).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Paper className="p-4">
          <Typography variant="h6" className="mb-2">Overview</Typography>
          <Typography>Date: {new Date(combat.date).toLocaleString()}</Typography>
          <Typography>Total Rounds: {combat.rounds}</Typography>
          <Typography>Combatants: {combat.combatants.length}</Typography>
          <Box className="mt-2">
            <Typography variant="subtitle2">Players:</Typography>
            <Box className="flex flex-wrap gap-1">
              {combat.combatants
                .filter(c => c.isPlayer)
                .map(c => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
            </Box>
          </Box>
          <Box className="mt-2">
            <Typography variant="subtitle2">Enemies:</Typography>
            <Box className="flex flex-wrap gap-1">
              {combat.combatants
                .filter(c => !c.isPlayer)
                .map(c => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                ))}
            </Box>
          </Box>
        </Paper>

        <Paper className="p-4">
          <Typography variant="h6" className="mb-4">Combat Statistics</Typography>
          <StatSummary combat={combat} />
        </Paper>
      </Box>

      <Paper className="p-4 mb-6">
        <Typography variant="h6" className="mb-2">Combatants</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="center">Initiative</TableCell>
                <TableCell align="center">HP</TableCell>
                <TableCell align="center">AC</TableCell>
                <TableCell align="center">Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combat.combatants.map((combatant) => (
                <TableRow key={combatant.id}>
                  <TableCell>{combatant.name}</TableCell>
                  <TableCell align="center">{combatant.initiative}</TableCell>
                  <TableCell align="center">{combatant.currentHP} / {combatant.maxHP}</TableCell>
                  <TableCell align="center">{combatant.ac}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={combatant.isPlayer ? 'Player' : 'NPC'}
                      color={combatant.isPlayer ? 'primary' : 'default'}
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
    </div>
  );
}