import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  text: string;
  type: 'damage' | 'healing' | 'status' | 'turn' | 'round';
}

interface CombatLogProps {
  entries: CombatLogEntry[];
  onClearLog?: () => void;
}

export function CombatLog({ entries, onClearLog }: CombatLogProps) {
  const getEntryColor = (type: CombatLogEntry['type']) => {
    switch (type) {
      case 'damage':
        return 'text-red-600';
      case 'healing':
        return 'text-green-600';
      case 'status':
        return 'text-purple-600';
      case 'turn':
        return 'text-yellow-600';
      case 'round':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Paper className="p-4 h-[400px] flex flex-col">
      <Box className="flex justify-between items-center mb-2">
        <Box className="flex items-center gap-2">
          <HistoryIcon color="primary" />
          <Typography variant="h6">Combat Log</Typography>
        </Box>
        {onClearLog && (
          <Tooltip title="Clear Log">
            <IconButton onClick={onClearLog} size="small">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <List className="overflow-auto flex-grow">
        {entries.length === 0 ? (
          <ListItem>
            <ListItemText
              secondary="No actions taken yet"
              className="text-center text-gray-500"
            />
          </ListItem>
        ) : (
          entries.map((entry) => (
            <ListItem key={entry.id} dense>
              <ListItemText
                primary={
                  <span className={getEntryColor(entry.type)}>
                    {entry.text}
                  </span>
                }
                secondary={new Date(entry.timestamp).toLocaleTimeString()}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}