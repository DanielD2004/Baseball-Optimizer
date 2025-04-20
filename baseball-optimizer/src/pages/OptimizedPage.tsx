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

const URL = import.meta.env.VITE_NGROK_URL

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
    field: schedulePlayer[];
    bench: schedulePlayer[];
}

interface PositionOption {
    label: string;
}

interface Player {
    player_name: string;
    team_id: string;
    skill: number;
    positions: { [key: string]: PositionOption };
    player_id?: string;
    default: boolean;
    gender: string;
}

interface schedulePlayer {
    id: string;
    name: string;
    position?: string;
} 

interface LocationState {
    team: Team;
    isPlaying: { [playerName: string]: boolean };
}

function OptimizedPage() {
    const innings: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<{ [playerName: string]: string[] } | null>(null);
    const [rowOrder, setRowOrder] = useState<string[]>([]);
    const [players, setPlayers] = useState();
    const [importance, setImportance] = useState();
    const location = useLocation();
    const { team, isPlaying }= location.state as LocationState;
    const { user } = useUser();
    const navigate = useNavigate();

    const fetchPlayers = async () => {
        console.log("fetching players")
            try {
                const response = await fetch(`${URL}/api/teams/${team.team_id}/players`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (data) {
                    const activePlayers = data.filter((player: Player) => isPlaying[player.player_name]);
                    setPlayers(activePlayers);
                }
            } catch (err) {
                console.error(err);
            }
        };

    const fetchImportance = async () => {
        try {
            const response = await fetch(`${URL}/api/teams/${team.team_id}/importance`, {
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
            const response = await fetch(`${URL}/api/teams/${team.team_id}/lineup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, importance }),
            });
    
            const data = await response.json();
            const processedData = getPlayerPositionsByInning(data)
            setResult(processedData);
            setRowOrder(Object.keys(processedData))
            sessionStorage.setItem("rowOrder", JSON.stringify(Object.keys(processedData)))
            setLoading(false);
        } catch (err) {
            console.error(err);
            setResult(null);
        }
    }

    
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
        return playerPositionsByInning;
    }
    
    const moveRow = (index: number, direction: "up" | "down") => {
        setRowOrder((prev) => {
            const newOrder = [...prev]
            const newIndex = direction === "up" ? index - 1 : index + 1
            if (newIndex >= rowOrder.length || newIndex < 0) {
                return prev;
            }
            else{
                // swap the orders
                const temp = newOrder[index]
                newOrder[index] = newOrder[newIndex]
                newOrder[newIndex] = temp
                sessionStorage.setItem("rowOrder", JSON.stringify(newOrder))
                return newOrder
            }
        })
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
            getLineup();
        }
    }, [players, importance]);

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
                                {/* Object.entries(result).map(([playerName, positions], index) this way, index could change - objects are unordered and can change */}
                                {/* keeps consistent indexing */}
                                {result && rowOrder.map((playerName, index) => {
                                    const positions = result[playerName]
                                    return (
                                        <TableRow key={playerName}>
                                            <TableCell>
                                                <div className='flex flex-row gap-3 w-fit font-bold mx-auto'>
                                                    <h2 className='select-none mt-1 mr-5'>{playerName}</h2>
                                                    <div onClick={() => moveRow(index, "up")} className='select-none cursor-pointer bg-gray-200 p-1 w-15 text-center rounded-lg border-black border-1'>Up</div>
                                                    <div onClick={() => moveRow(index, "down")} className='select-none cursor-pointer bg-gray-200 p-1 w-15 text-center rounded-lg border-black border-1'>Down</div>
                                                </div>
                                            </TableCell>
                                            {positions.map((position, i) => (
                                                <TableCell key={i} align="center"  sx={{backgroundColor: position === 'X' ? '#ff999b' : '#99ffa3', fontWeight: 'bold'}}>{position}</TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div> 
            )}
        </div>
    );
}

export default OptimizedPage