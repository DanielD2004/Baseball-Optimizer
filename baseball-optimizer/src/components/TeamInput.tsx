import React, { useState } from 'react';
import players from '../backend/players.json';
import PositionSelect from './PositionSelect';
import { TextField, Flex } from '@radix-ui/themes';
import { Label } from '@radix-ui/themes/components/context-menu';

interface LineupResult {
  objective_score?: number;
  lineup?: Record<string, { field: Record<string, string>, bench: string[] }>;
  error?: string;
}

function TeamInput() {
  const [result, setResult] = useState<LineupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      const response = await fetch('http://localhost:5000/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ players: players.players }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(null);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>
        Optimize Lineup
      </button>

      <div style={{marginBottom: '20px'}}>
        <Flex>
          <TextField.Root placeholder="Player Name" name="playerName" id="playerName"/>
        </Flex>
      </div>

      <Label>Preferred Positions</Label>
      <PositionSelect/>
      
      {/* {error && <div style={{color: 'red'}}>Error: {error}</div>}
      {result && (
        <div>
          <h3>Objective Score: {result.objective_score}</h3>
          {result.lineup && Object.entries(result.lineup).map(([inning, lineup]) => (
            <div key={inning}>
              <h4>Inning {parseInt(inning) + 1}</h4>
              <div>
                <strong>On Field:</strong>
                <ul>
                  {Object.entries(lineup.field).map(([position, player]) => (
                    <li key={position}>{position}: {player}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Bench:</strong>
                <ul>
                  {lineup.bench.map(player => (
                    <li key={player}>{player}</li>
                  ))}
                </ul>
              </div>
              <hr/>
              <br/>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}

export default TeamInput;