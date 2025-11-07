import React, { useState } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { CombatHistory, CombatStats } from '../context/CombatContext';

interface StatSummaryProps {
  combat: CombatHistory;
  showAll?: boolean;
}

interface StatCategory {
  title: string;
  data: { [key: string]: number };
  format?: (value: number) => string;
  inverse?: boolean;
}

export function StatSummary({ combat, showAll = false }: StatSummaryProps) {
  const [selectedCombatant, setSelectedCombatant] = useState<string>('');

  const stats = combat.stats || {
    damageDealt: {},
    damageTaken: {},
    healingDone: {},
    healingReceived: {},
    hits: {},
    misses: {},
    savingThrowsForced: {},
    savingThrowsMade: {},
    savingThrowsFailed: {},
    kills: {},
    knockouts: {},
  };

  const statCategories: StatCategory[] = [
    { title: 'Damage Dealt', data: stats.damageDealt || {} },
    { title: 'Damage Taken', data: stats.damageTaken || {} },
    { title: 'Healing Done', data: stats.healingDone || {} },
    { title: 'Healing Received', data: stats.healingReceived || {} },
    { title: 'Hits Landed', data: stats.hits || {} },
    { title: 'Attacks Missed', data: stats.misses || {} },
    { title: 'Saving Throws Forced', data: stats.savingThrowsForced || {} },
    { title: 'Saving Throws Made', data: stats.savingThrowsMade || {} },
    { title: 'Saving Throws Failed', data: stats.savingThrowsFailed || {} },
    { title: 'Knockouts Scored', data: stats.kills || {} },
    { title: 'Times Knocked Out', data: stats.knockouts || {} },
  ];

  const getAllCombatants = () => {
    const combatants = new Set<string>();
    Object.values(combat.stats as CombatStats).forEach(statCategory => {
      Object.keys(statCategory).forEach(name => combatants.add(name));
    });
    return Array.from(combatants).sort();
  };

  const sortByValue = (obj: { [key: string]: number }, inverse = false) => {
    return Object.entries(obj)
      .sort(([,a], [,b]) => inverse ? a - b : b - a)
      .map(([name, value]) => ({ name, value }));
  };

  const renderStat = (category: StatCategory) => {
    const sorted = sortByValue(category.data, category.inverse);
    const hasData = sorted.length > 0;

    if (!hasData) return (
      <Typography color="text.secondary" variant="body2">
        No data available
      </Typography>
    );

    if (selectedCombatant) {
      const value = category.data[selectedCombatant] || 0;
      const rank = sorted.findIndex(item => item.name === selectedCombatant) + 1;
      return (
        <Typography>
          {value} {rank ? `(Rank #${rank})` : ''}
        </Typography>
      );
    }

    return (
      <Box>
        {sorted.slice(0, 3).map(({ name, value }, index) => (
          <Typography 
            key={name} 
            color={index === 0 ? 'primary' : 'text.secondary'}
            variant={index === 0 ? 'body1' : 'body2'}
          >
            {index + 1}. {name}: {value}
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <FormControl fullWidth variant="outlined" className="mb-4">
        <InputLabel>Select Combatant</InputLabel>
        <Select
          value={selectedCombatant}
          onChange={(e) => setSelectedCombatant(e.target.value as string)}
          label="Select Combatant"
        >
          <MenuItem value="">
            <em>Show Top 3</em>
          </MenuItem>
          {getAllCombatants().map(name => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCategories.map(category => (
          <Paper key={category.title} className="p-4">
            <Typography variant="h6" className="mb-2">
              {category.title}
            </Typography>
            {renderStat(category)}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}