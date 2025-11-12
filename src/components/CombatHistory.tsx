import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
} from '@mui/material';
import { useCombat } from '../context/CombatContext';

export function CombatHistory() {
  const { getCombatHistory } = useCombat();
  const navigate = useNavigate();
  const history = getCombatHistory();

  return (
    <div className="container mx-auto p-4">
      <Typography variant="h4" className="mb-6">
        Combat History
      </Typography>

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
                      <Typography variant="body2" color="text.secondary">
                        {new Date(combat.date).toLocaleDateString()} {new Date(combat.date).toLocaleTimeString()}
                      </Typography>
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
    </div>
  );
}