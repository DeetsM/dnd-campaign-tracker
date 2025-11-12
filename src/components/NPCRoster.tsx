import { useState, FormEvent, useEffect } from 'react';
import { NPC } from '../types';
import { NPCService, StoredNPC } from '../services/npcService';
import { 
  Box, 
  Button, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Typography,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface NPCRosterProps {
  onAddNPC?: (npc: NPC) => void;
  onUpdateNPC?: (oldId: string, updatedNPC: NPC) => void;
  onDeleteNPC?: (id: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`npc-tabpanel-${index}`}
      aria-labelledby={`npc-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export function NPCRoster({ 
  onAddNPC,
  onUpdateNPC,
  onDeleteNPC
}: NPCRosterProps) {
  const [npcs, setNpcs] = useState<StoredNPC[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formNPC, setFormNPC] = useState<Partial<StoredNPC>>({
    name: '',
    maxHP: 0,
    initiative: 0,
    ac: 10,
    type: 'enemy'
  });

  // Load NPCs from database on mount
  useEffect(() => {
    const loadNPCs = async () => {
      setIsLoading(true);
      try {
        const loaded = await NPCService.getAll();
        setNpcs(loaded);
      } catch (error) {
        console.error('Error loading NPCs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNPCs();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        // Update existing NPC
        const updated = await NPCService.update(editingId, {
          name: formNPC.name || '',
          maxHP: formNPC.maxHP || 0,
          ac: formNPC.ac || 10,
          initiative: formNPC.initiative || 0,
          type: (formNPC.type as 'enemy' | 'ally') || 'enemy',
        });
        
        if (updated) {
          setNpcs(prev => prev.map(n => n.id === editingId ? updated : n));
          onUpdateNPC?.(editingId, updated);
        }
        setEditingId(null);
      } else {
        // Create new NPC
        const newNPC = await NPCService.create({
          name: formNPC.name || '',
          maxHP: formNPC.maxHP || 0,
          ac: formNPC.ac || 10,
          initiative: formNPC.initiative || 0,
          type: (formNPC.type as 'enemy' | 'ally') || 'enemy',
        });
        
        if (newNPC) {
          setNpcs(prev => [...prev, newNPC]);
          onAddNPC?.(newNPC);
        }
      }
      
      setFormNPC({ name: '', maxHP: 0, initiative: 0, ac: 10, type: 'enemy' });
    } catch (error) {
      console.error('Error saving NPC:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (npc: StoredNPC) => {
    setEditingId(npc.id);
    setFormNPC(npc);
    // Switch to appropriate tab
    setTabValue(npc.type === 'ally' ? 1 : 0);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormNPC({ name: '', maxHP: 0, initiative: 0, ac: 10, type: 'enemy' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this NPC?')) {
      try {
        if (await NPCService.delete(id)) {
          setNpcs(prev => prev.filter(n => n.id !== id));
          onDeleteNPC?.(id);
        }
      } catch (error) {
        console.error('Error deleting NPC:', error);
      }
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (!editingId) {
      setFormNPC({ 
        name: '', 
        maxHP: 0, 
        initiative: 0, 
        ac: 10, 
        type: newValue === 0 ? 'enemy' : 'ally' 
      });
    }
  };

  const filteredNPCs = (type: 'enemy' | 'ally') => {
    return npcs.filter(npc => npc.type === type);
  };

  const renderTable = (type: 'enemy' | 'ally') => {
    const filtered = filteredNPCs(type);
    
    if (filtered.length === 0) {
      return (
        <Paper className="p-4 text-center">
          <Typography color="text.secondary">
            No {type}s created yet. Add one above!
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-100">
              <TableCell className="text-white"><strong>Name</strong></TableCell>
              <TableCell align="center" className="text-white"><strong>Max HP</strong></TableCell>
              <TableCell align="center" className="text-white"><strong>AC</strong></TableCell>
              <TableCell align="center" className="text-white"><strong>Initiative</strong></TableCell>
              <TableCell align="center" className="text-white"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((npc) => (
              <TableRow 
                key={npc.id}
                className={editingId === npc.id ? 'bg-blue-50' : ''}
              >
                <TableCell>{npc.name}</TableCell>
                <TableCell align="center">{npc.maxHP}</TableCell>
                <TableCell align="center">{npc.ac}</TableCell>
                <TableCell align="center">{npc.initiative || 0}</TableCell>
                <TableCell align="center">
                  {editingId !== npc.id ? (
                    <Box className="flex gap-2 justify-center">
                      <Button
                        onClick={() => startEditing(npc)}
                        startIcon={<EditIcon />}
                        size="small"
                        variant="outlined"
                        disabled={isSaving}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(npc.id)}
                        startIcon={<DeleteIcon />}
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={isSaving}
                      >
                        Delete
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="info.main">Editing...</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (isLoading) {
    return (
      <Box className="container mx-auto p-4" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="container mx-auto p-4">
      <Typography variant="h4" className="mb-6">NPC Management</Typography>
      
      <Paper className="p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Box className="flex items-end gap-4">
            <TextField
              label="NPC Name"
              fullWidth
              value={formNPC.name || ''}
              onChange={(e) => setFormNPC({ ...formNPC, name: e.target.value })}
              required
              disabled={isSaving}
              className="flex-1"
            />
            
            <FormControl sx={{ minWidth: 150 }} disabled={isSaving}>
              <InputLabel id="npc-type-label">Type</InputLabel>
              <Select
                labelId="npc-type-label"
                value={formNPC.type || 'enemy'}
                onChange={(e) => setFormNPC({ ...formNPC, type: e.target.value as 'enemy' | 'ally' })}
                label="Type"
              >
                <MenuItem value="enemy">Enemy</MenuItem>
                <MenuItem value="ally">Ally</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Max HP"
              type="number"
              value={formNPC.maxHP || 0}
              onChange={(e) => setFormNPC({ ...formNPC, maxHP: parseInt(e.target.value) || 0 })}
              required
              disabled={isSaving}
            />
            
            <TextField
              label="AC"
              type="number"
              value={formNPC.ac || 10}
              onChange={(e) => setFormNPC({ ...formNPC, ac: parseInt(e.target.value) || 10 })}
              required
              disabled={isSaving}
            />
            
            <TextField
              label="Initiative Modifier"
              type="number"
              value={formNPC.initiative || 0}
              onChange={(e) => setFormNPC({ ...formNPC, initiative: parseInt(e.target.value) || 0 })}
              disabled={isSaving}
            />
          </Box>

          <Box className="flex gap-2">
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              disabled={isSaving}
            >
              {editingId ? 'Save Changes' : 'Add NPC'}
            </Button>
            
            {editingId && (
              <Button 
                type="button" 
                onClick={cancelEditing} 
                variant="outlined"
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Paper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="NPC Type Tabs"
        >
          <Tab label={`Enemies (${filteredNPCs('enemy').length})`} id="npc-tab-0" />
          <Tab label={`Allies (${filteredNPCs('ally').length})`} id="npc-tab-1" />
        </Tabs>

        <Box className="p-4">
          <TabPanel value={tabValue} index={0}>
            {renderTable('enemy')}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderTable('ally')}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
