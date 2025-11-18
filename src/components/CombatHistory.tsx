import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useCombat } from '../context/CombatContext';
import { CombatImportDialog } from './CombatImportDialog';

export function CombatHistory() {
  const { getCombatHistory, deleteCombat } = useCombat();
  const navigate = useNavigate();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const history = getCombatHistory();

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteCombat(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4">
          Combat History
        </Typography>
        <Tooltip title="Import previous combats">
          <Fab
            color="primary"
            aria-label="import"
            onClick={() => setImportDialogOpen(true)}
            size="small"
          >
            <UploadIcon />
          </Fab>
        </Tooltip>
      </Box>

      {history.length === 0 ? (
        <Paper className="p-4">
          <Typography>No combat history available.</Typography>
        </Paper>
      ) : (
        <List component={Paper}>
          {history.map((combat) => (
            <div key={combat.id}>
              <ListItem 
                onClick={() => navigate(`/history/${combat.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
                sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}
              >
                <ListItemText
                  primary={
                    <Box className="flex justify-between items-center">
                      <Typography variant="h6">
                        {combat.title}
                      </Typography>
                      <Box className="flex items-center gap-2">
                        <Typography variant="body2" color="text.secondary">
                          {new Date(combat.date).toLocaleDateString()}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(combat.id);
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box className="mt-2">
                      <Typography variant="body2" color="text.secondary">
                        Rounds: {combat.rounds} | Combatants: {combat.combatants.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Most Damage: {
                          Object.entries(combat.stats.damageDealt)
                            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                        }
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider />
            </div>
          ))}
        </List>
      )}

      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
      >
        <DialogTitle>Delete Combat History</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this combat record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <CombatImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      />
    </div>
  );
}