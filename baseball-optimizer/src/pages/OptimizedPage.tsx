import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface Team {
    team_id: string;
    user_id: string;
    team_name: string;
    season: string;
    division: string;
}

interface Schedule {
    objective_value: number;
    player_sits: { [playerName: string]: number };
    schedule: { [inning: number]: Inning };
}

interface Inning {
    field: Player[];
    bench: Player[];
}

interface Player {
    id: string;
    name: string;
    position: string;
    skill: number;
    gender: string;
}

interface schedulePlayer {
    id: string;
    name: string;
    position?: string;
} 

function OptimizedPage() {
    const innings: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<{ [playerName: string]: string[] } | null>(null);
    const [players, setPlayers] = useState();
    const [importance, setImportance] = useState();
    const location = useLocation();
    const team: Team = location.state as Team;
    const { user } = useUser();
    const navigate = useNavigate();

    const fetchPlayers = async () => {
        console.log("fetching players")
            try {
                const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/players`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (data) {
                    setPlayers(data);
                }
            } catch (err) {
                console.error(err);
            }
        };

    const fetchImportance = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/importance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data) {
                console.log("Here is the data that were fetched ", data.importance)
                setImportance(data.importance);
            } else {
                console.log("No importance data found, using defaults.");
            }
        } catch (err) {
            console.error("Error fetching importance:", err);
        }
    };

    const getLineup = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/lineup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, importance }),
            });
    
            const data = await response.json();
            setResult(getPlayerPositionsByInning(data));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setResult(null);
        }
    }

    useEffect(() => {
        fetchPlayers();
        fetchImportance();
    }, []);

    useEffect(() => {
            if (!team || !user) {
                navigate('/');
                return;
            }
            if (user && team && team.user_id !== user.id) {
                navigate('/');
            }
    
            fetchPlayers();
            fetchImportance();
        }, [user, team]);

    useEffect(() => {
        if (players && importance) {
            console.log("Players and importance are set, getting lineup")
            getLineup();
        }
    }, [players, importance]);
    
    function getPlayerPositionsByInning(schedule: Schedule) {
        const playerPositionsByInning: { [playerName: string]: string[] } = {};
        const innings = 9;
        
        // init all players with arrays of 'X'
        for (const inningNum in schedule.schedule) {
          const inning = schedule.schedule[inningNum]; // inning is the object with field and bench subObjects
          // add bench
          inning.bench.forEach((player: schedulePlayer) => {
            if (!playerPositionsByInning[player.name]) {
              playerPositionsByInning[player.name] = Array(innings).fill("X");
            }
          });
          // add field 
          inning.field.forEach((player: schedulePlayer) => {
            if (!playerPositionsByInning[player.name]) {
              playerPositionsByInning[player.name] = Array(innings).fill("X");
            }
          });
        }
        
        // fill in proper positions
        for (const inningNum in schedule.schedule) {
          const inning = schedule.schedule[inningNum];
          const indexPosition = parseInt(inningNum) - 1; // convert to 0 index
          
          // set field positions
          inning.field.forEach((player: schedulePlayer) => {
            // access object through player name and update position array accordingly
            playerPositionsByInning[player.name][indexPosition] = player.position ?? "X";
          });
        }
        console.log(playerPositionsByInning)
        return playerPositionsByInning;
      }

      return (
        <div className='bg-cyan-50'>
            {loading ? (
                <div className="h-screen -mt-20 flex flex-col justify-center items-center" >
                    <Ring size="75"></Ring>
                    <div className='mt-5'>This may take a few moments</div>
                </div>
            ) : (
                <div className='w-screen mt-25 mx-auto'>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" sx={{fontWeight: 'bold'}}>Name</TableCell>
                                    {/* fill out top row */}
                                    {innings.map((inning) => (
                                        <TableCell sx={{fontWeight: 'bold'}} key={inning} align="center">
                                            Inning {inning}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {result && Object.entries(result).map(([playerName, positions]) => (
                                    <TableRow key={playerName}>
                                        <TableCell align="center" sx={{fontWeight: 'bold'}} scope="row">{playerName}</TableCell>
                                        {positions.map((position, index) => (
                                            <TableCell key={index} align="center" sx={{backgroundColor: position === 'X' ? '#ff999b' : '#99ffa3', fontWeight: 'bold'}}>
                                                {position}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div> 
            )}
        </div>
    );
}

export default OptimizedPage