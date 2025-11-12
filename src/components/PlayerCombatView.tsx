import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { ArrowForward as NextTurnIcon } from '@mui/icons-material';
import { CombatLog } from './CombatLog';
import type { CombatLogEntry } from './CombatLog';

interface Combatant {
  id: string;
  name: string;
  maxHP: number;
  currentHP: number;
  tempHP: number;
  ac: number;
  initiative: number;
  isPlayer: boolean;
  conditions?: string[];
}

interface PlayerCombatViewProps {
  combatants: Combatant[];
  currentTurn: number;
  round: number;
  logEntries: CombatLogEntry[];
}

export function PlayerCombatView({ 
  combatants,
  currentTurn,
  round,
  logEntries
}: PlayerCombatViewProps) {
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  return (
    <div className="container mx-auto p-4">
      <Box className="mb-6">
        <Typography variant="h4">
          Combat Round {round}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-700">
              <TableCell className="text-white">Name</TableCell>
              <TableCell className="text-white">Initiative</TableCell>
              <TableCell align="center" className="text-white">HP</TableCell>
              <TableCell align="center" className="text-white">Temp HP</TableCell>
              <TableCell align="center" className="text-white">AC</TableCell>
              <TableCell align="center" className="text-white">Status Effects</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCombatants.map((combatant, index) => (
              <TableRow 
                key={combatant.id}
                className={`
                  ${combatant.isPlayer ? 'bg-blue-50' : ''}
                  ${index === currentTurn ? 'bg-yellow-100' : ''}
                  ${combatant.currentHP === 0 ? 'bg-red-100' : ''}
                `}
              >
                <TableCell>
                  <Box className="flex items-center gap-2">
                    {index === currentTurn && (
                      <NextTurnIcon fontSize="small" className="text-yellow-500" />
                    )}
                    <Typography variant="body1" className="font-medium">
                      {combatant.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{combatant.initiative}</TableCell>
                <TableCell align="center">
                  <Box className={`
                    flex justify-center items-center gap-2 font-bold
                    ${combatant.currentHP < combatant.maxHP / 2 ? 'text-orange-600' : ''}
                    ${combatant.currentHP === 0 ? 'text-red-600' : 'text-green-600'}
                  `}>
                    {combatant.currentHP} / {combatant.maxHP}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography 
                    className={`font-bold ${(combatant.tempHP || 0) > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    {combatant.tempHP || 0}
                  </Typography>
                </TableCell>
                <TableCell align="center">{combatant.ac}</TableCell>
                <TableCell align="center">
                  {combatant.conditions && combatant.conditions.length > 0 ? (
                    <Box className="flex gap-1 flex-wrap justify-center">
                      {combatant.conditions.map((condition) => (
                        <Typography
                          key={condition}
                          variant="body2"
                          className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-sm"
                        >
                          {condition}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Combat log without clear button */}
      <Box className="mt-4">
        <CombatLog 
          entries={logEntries}
        />
      </Box>
    </div>
  );
}