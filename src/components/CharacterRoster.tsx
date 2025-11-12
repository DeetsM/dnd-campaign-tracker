import { useState, FormEvent, useEffect } from 'react';
import { Character } from '../types';
import { CharacterService, StoredCharacter } from '../services/characterService';
import { Box, Button, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Typography } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

interface CharacterRosterProps {
  characters?: Character[];
  onAddCharacter?: (character: Character) => void;
  onUpdateCharacter?: (oldName: string, updatedCharacter: Character) => void;
  onDeleteCharacter?: (name: string) => void;
}

export function CharacterRoster({ 
  characters: externalCharacters = [],
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter
}: CharacterRosterProps) {
  const [characters, setCharacters] = useState<StoredCharacter[]>(externalCharacters as StoredCharacter[]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formCharacter, setFormCharacter] = useState<Partial<StoredCharacter>>({
    name: '',
    maxHP: 0,
    initiative: 0,
    ac: 10
  });

  // Load characters from database on mount
  useEffect(() => {
    const loadCharacters = async () => {
      setIsLoading(true);
      try {
        const loaded = await CharacterService.getAll();
        setCharacters(loaded);
      } catch (error) {
        console.error('Error loading characters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingId) {
        // Update existing character
        const updated = await CharacterService.update(editingId, {
          name: formCharacter.name || '',
          maxHP: formCharacter.maxHP || 0,
          ac: formCharacter.ac || 10,
          initiative: formCharacter.initiative || 0,
        });
        
        if (updated) {
          setCharacters(prev => prev.map(c => c.id === editingId ? updated : c));
          onUpdateCharacter?.(editingId, updated);
        }
        setEditingId(null);
      } else {
        // Create new character
        const newChar = await CharacterService.create({
          name: formCharacter.name || '',
          maxHP: formCharacter.maxHP || 0,
          ac: formCharacter.ac || 10,
          initiative: formCharacter.initiative || 0,
        });
        
        if (newChar) {
          setCharacters(prev => [...prev, newChar]);
          onAddCharacter?.(newChar);
        }
      }
      
      setFormCharacter({ name: '', maxHP: 0, initiative: 0, ac: 10 });
    } catch (error) {
      console.error('Error saving character:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (character: StoredCharacter) => {
    setEditingId(character.id);
    setFormCharacter(character);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormCharacter({ name: '', maxHP: 0, initiative: 0, ac: 10 });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        const character = characters.find(c => c.id === id);
        if (await CharacterService.delete(id)) {
          setCharacters(prev => prev.filter(c => c.id !== id));
          onDeleteCharacter?.(character?.name || '');
        }
      } catch (error) {
        console.error('Error deleting character:', error);
      }
    }
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
      <Typography variant="h4" className="mb-6">Character Roster</Typography>
      
      <Paper className="p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Character Name"
            fullWidth
            value={formCharacter.name || ''}
            onChange={(e) => setFormCharacter({ ...formCharacter, name: e.target.value })}
            required
            disabled={isSaving}
          />
          
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Max HP"
              type="number"
              value={formCharacter.maxHP || 0}
              onChange={(e) => setFormCharacter({ ...formCharacter, maxHP: parseInt(e.target.value) || 0 })}
              required
              disabled={isSaving}
            />
            
            <TextField
              label="AC"
              type="number"
              value={formCharacter.ac || 10}
              onChange={(e) => setFormCharacter({ ...formCharacter, ac: parseInt(e.target.value) || 10 })}
              required
              disabled={isSaving}
            />
            
            <TextField
              label="Initiative Modifier"
              type="number"
              value={formCharacter.initiative || 0}
              onChange={(e) => setFormCharacter({ ...formCharacter, initiative: parseInt(e.target.value) || 0 })}
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
              {editingId ? 'Save Changes' : 'Add Character'}
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

      {characters.length === 0 ? (
        <Paper className="p-4">
          <Typography color="text.secondary">No characters created yet. Add one above!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-100">
                <TableCell><strong>Name</strong></TableCell>
                <TableCell align="center"><strong>Max HP</strong></TableCell>
                <TableCell align="center"><strong>AC</strong></TableCell>
                <TableCell align="center"><strong>Initiative</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {characters.map((character) => (
                <TableRow 
                  key={character.id}
                  className={editingId === character.id ? 'bg-blue-50' : ''}
                >
                  <TableCell>{character.name}</TableCell>
                  <TableCell align="center">{character.maxHP}</TableCell>
                  <TableCell align="center">{character.ac}</TableCell>
                  <TableCell align="center">{character.initiative || 0}</TableCell>
                  <TableCell align="center">
                    {editingId !== character.id ? (
                      <Box className="flex gap-2 justify-center">
                        <Button
                          onClick={() => startEditing(character)}
                          startIcon={<EditIcon />}
                          size="small"
                          variant="outlined"
                          disabled={isSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(character.id)}
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
      )}
    </Box>
  );
}