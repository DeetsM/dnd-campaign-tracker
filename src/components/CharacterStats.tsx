import { useState, useEffect } from 'react';
import { CharacterService } from '../services/characterService';
import { CharacterStatsService } from '../services/characterStatsService';
import { CombatService } from '../services/combatService';
import { NPCService } from '../services/npcService';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';


interface CharacterStatsDisplay {
  id: string;
  name: string;
  nat20s: number;
  nat1s: number;
  totalKills: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  maxDamageDealtInCombat: number;
  maxDamageTakenInCombat: number;
  totalHits: number;
  totalMisses: number;
  totalHitsAgainst: number;
  totalMissesAgainst: number;
  totalSavingThrowsForced: number;
  totalSavingThrowsMade: number;
}

export function CharacterStats() {
  const [playerStats, setPlayerStats] = useState<CharacterStatsDisplay[]>([]);
  const [allyStats, setAllyStats] = useState<CharacterStatsDisplay[]>([]);
  const [enemyStats, setEnemyStats] = useState<CharacterStatsDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'individual' | 'summary'>('individual');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Load characters (players)
      const loadedCharacters = await CharacterService.getAll();
      
      // Load NPCs (allies and enemies)
      const allAllies = await NPCService.getAllies();
      const allEnemies = await NPCService.getEnemies();

      // Load roll stats
      const rollStats = await CharacterStatsService.getAllRollStats();

      // Load combat history and calculate stats
      const combats = await CombatService.getHistory();

      // Helper function to calculate stats for a character/NPC
      const calculateStatsForEntity = (entity: { id: string; name: string }): CharacterStatsDisplay => {
        const entityStats: CharacterStatsDisplay = {
          id: entity.id,
          name: entity.name,
          nat20s: rollStats[entity.id]?.nat20s || 0,
          nat1s: rollStats[entity.id]?.nat1s || 0,
          totalKills: 0,
          totalDamageDealt: 0,
          totalDamageTaken: 0,
          maxDamageDealtInCombat: 0,
          maxDamageTakenInCombat: 0,
          totalHits: 0,
          totalMisses: 0,
          totalHitsAgainst: 0,
          totalMissesAgainst: 0,
          totalSavingThrowsForced: 0,
          totalSavingThrowsMade: 0,
        };

        // Calculate stats from combat history
        combats.forEach(combat => {
          const stats = combat.stats;

          if (stats) {
            entityStats.totalKills += stats.kills[entity.name] || 0;
            entityStats.totalDamageDealt += stats.damageDealt[entity.name] || 0;
            entityStats.totalDamageTaken += stats.damageTaken[entity.name] || 0;
            entityStats.maxDamageDealtInCombat = Math.max(
              entityStats.maxDamageDealtInCombat,
              stats.damageDealt[entity.name] || 0
            );
            entityStats.maxDamageTakenInCombat = Math.max(
              entityStats.maxDamageTakenInCombat,
              stats.damageTaken[entity.name] || 0
            );
            entityStats.totalHits += stats.hits[entity.name] || 0;
            entityStats.totalMisses += stats.misses[entity.name] || 0;
            entityStats.totalHitsAgainst += stats.knockouts[entity.name] ? 1 : 0;
            entityStats.totalSavingThrowsForced += stats.savingThrowsForced[entity.name] || 0;
            entityStats.totalSavingThrowsMade += stats.savingThrowsMade[entity.name] || 0;
            entityStats.totalSavingThrowsMade += stats.savingThrowsFailed[entity.name] || 0;
          }
        });

        return entityStats;
      };

      // Calculate stats for each entity
      const playerStatsData = loadedCharacters.map(calculateStatsForEntity);
      const allyStatsData = allAllies.map(calculateStatsForEntity);
      const enemyStatsData = allEnemies.map(calculateStatsForEntity);

      setPlayerStats(playerStatsData);
      setAllyStats(allyStatsData);
      setEnemyStats(enemyStatsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogNat20 = async (characterId: string) => {
    const success = await CharacterStatsService.addRoll(characterId, 'nat20');
    if (success) {
      loadStats();
    }
  };

  const handleLogNat1 = async (characterId: string) => {
    const success = await CharacterStatsService.addRoll(characterId, 'nat1');
    if (success) {
      loadStats();
    }
  };

  const calculateTotalStats = (stats: CharacterStatsDisplay[]): CharacterStatsDisplay => {
    return stats.reduce(
      (acc, char) => ({
        id: 'total',
        name: 'Total',
        nat20s: acc.nat20s + char.nat20s,
        nat1s: acc.nat1s + char.nat1s,
        totalKills: acc.totalKills + char.totalKills,
        totalDamageDealt: acc.totalDamageDealt + char.totalDamageDealt,
        totalDamageTaken: acc.totalDamageTaken + char.totalDamageTaken,
        maxDamageDealtInCombat: Math.max(acc.maxDamageDealtInCombat, char.maxDamageDealtInCombat),
        maxDamageTakenInCombat: Math.max(acc.maxDamageTakenInCombat, char.maxDamageTakenInCombat),
        totalHits: acc.totalHits + char.totalHits,
        totalMisses: acc.totalMisses + char.totalMisses,
        totalHitsAgainst: acc.totalHitsAgainst + char.totalHitsAgainst,
        totalMissesAgainst: acc.totalMissesAgainst + char.totalMissesAgainst,
        totalSavingThrowsForced: acc.totalSavingThrowsForced + char.totalSavingThrowsForced,
        totalSavingThrowsMade: acc.totalSavingThrowsMade + char.totalSavingThrowsMade,
      }),
      {
        id: 'total',
        name: 'Total',
        nat20s: 0,
        nat1s: 0,
        totalKills: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        maxDamageDealtInCombat: 0,
        maxDamageTakenInCombat: 0,
        totalHits: 0,
        totalMisses: 0,
        totalHitsAgainst: 0,
        totalMissesAgainst: 0,
        totalSavingThrowsForced: 0,
        totalSavingThrowsMade: 0,
      }
    );
  };

  const StatTable = ({ title, data, showActions = false }: { title: string; data: CharacterStatsDisplay[]; showActions?: boolean }) => {
    const displayData = viewMode === 'summary' ? [calculateTotalStats(data)] : data;

    return (
      <Box className="mb-8">
        <Typography variant="h5" className="mb-4">{title}</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-700">
                <TableCell className="text-white"><strong>Name</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Nat 20s</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Nat 1s</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Kills</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Damage Dealt</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Max Damage</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Damage Taken</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Max Taken</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Hits</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Misses</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Hits Against</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Misses Against</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Saves Forced</strong></TableCell>
                <TableCell align="center" className="text-white"><strong>Saves Made</strong></TableCell>
                {showActions && viewMode === 'individual' && <TableCell align="center" className="text-white"><strong>Actions</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell><strong>{item.name}</strong></TableCell>
                  <TableCell align="center">{item.nat20s}</TableCell>
                  <TableCell align="center">{item.nat1s}</TableCell>
                  <TableCell align="center">{item.totalKills}</TableCell>
                  <TableCell align="center">{item.totalDamageDealt}</TableCell>
                  <TableCell align="center">{item.maxDamageDealtInCombat}</TableCell>
                  <TableCell align="center">{item.totalDamageTaken}</TableCell>
                  <TableCell align="center">{item.maxDamageTakenInCombat}</TableCell>
                  <TableCell align="center">{item.totalHits}</TableCell>
                  <TableCell align="center">{item.totalMisses}</TableCell>
                  <TableCell align="center">{item.totalHitsAgainst}</TableCell>
                  <TableCell align="center">{item.totalMissesAgainst}</TableCell>
                  <TableCell align="center">{item.totalSavingThrowsForced}</TableCell>
                  <TableCell align="center">{item.totalSavingThrowsMade}</TableCell>
                  {showActions && viewMode === 'individual' && (
                    <TableCell align="center">
                      <Box className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleLogNat20(item.id)}
                          size="small"
                          variant="contained"
                          color="success"
                        >
                          +20
                        </Button>
                        <Button
                          onClick={() => handleLogNat1(item.id)}
                          size="small"
                          variant="contained"
                          color="error"
                        >
                          +1
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
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
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4">Combat Statistics</Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="individual">Individual</ToggleButton>
          <ToggleButton value="summary">Summary</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Party Members Table */}
      <StatTable 
        title="Party Members" 
        data={playerStats} 
        showActions={true}
      />

      {/* Allies Table */}
      {allyStats.length > 0 && (
        <StatTable 
          title="Allies" 
          data={allyStats} 
          showActions={true}
        />
      )}

      {/* Enemies Table */}
      {enemyStats.length > 0 && (
        <StatTable 
          title="Enemies (DM Stats)" 
          data={enemyStats} 
          showActions={false}
        />
      )}
    </Box>
  );
}
