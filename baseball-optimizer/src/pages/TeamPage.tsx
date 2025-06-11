import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import AddPlayer from '../components/AddPlayer';
import ImportanceModal from '../components/ImportanceModal';
import { Switch } from "radix-ui";
import "./TeamPage.css"
import { TrashIcon } from '@radix-ui/react-icons';

const URL = import.meta.env.VITE_NGROK_URL

interface Team {
    team_id: string;
    user_id: string;
    team_name: string;
    season: string;
    division: string;
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

interface Importance {
    "1B": number;
    "2B": number;
    "3B": number;
    "SS": number;
    "P": number;
    "C": number;
    "LF": number;
    "LC": number;
    "RC": number;
    "RF": number;
}

function TeamPage() {
    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({})
    const { user } = useUser();
    const navigate = useNavigate();
    const { teamId } = useParams<{ teamId: string }>(); 

    const [importance, setImportance] = useState<Importance>({
        "1B": 50,
        "2B": 50,
        "3B": 50,
        "SS": 50,
        "P": 50,
        "C": 50,
        "LF": 50,
        "LC": 50,
        "RC": 50,
        "RF": 50,
    });

    const positionOptions: PositionOption[] = [
        { label: "Wants To Play" },
        { label: "Can Play" },
        { label: "Cannot Play" }
    ];

    let defaultPlayer: Player | null = null;
    if (teamId) {
        defaultPlayer = {
            player_name: "",
            team_id: teamId,
            skill: 2.5,
            positions: Object.fromEntries(
                ["1B", "2B", "3B", "SS", "P", "C", "LF", "LC", "RC", "RF"].map(pos => [pos, positionOptions[2]])
            ),
            default: true,
            gender: "Male"
        };
    }

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${URL}/api/teams/${teamId}/players`, {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data) {
                setPlayers(data);
                setPlayersPlaying(data)
            }
        } catch (err) {
            console.error(err);
        }
    };

    const setPlayersPlaying = ((players: Player[]) => {
        const initialIsPlaying: { [key: string]: boolean } = {}
        players.forEach((player: Player) => {
            initialIsPlaying[player.player_name] = true;
        })
        setIsPlaying(initialIsPlaying)
    })

    const handlePlayingChange = ((playerName: string) => {
        setIsPlaying((prev) => ({
            ...prev,
            [playerName]: !prev[playerName]
        }))
    })

    const fetchImportance = async () => {
        try {
            const response = await fetch(`${URL}/api/teams/${teamId}/importance`, {
                method: 'GET',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data) {
                setImportance(data.importance);
            } else {
                console.log("No importance data found, using defaults.");
            }
        } catch (err) {
            console.error("Error fetching importance:", err);
        }
    };

    const updateImportance = async (newImportance: Importance) => {
        try {
            const response = await fetch(`${URL}/api/teams/${teamId}/importance`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    importance: newImportance,
                }),
            });

            if (!response.ok) {
                console.error(`Error: ${response.status}`);
                return;
            }

            const result = await response.json();
            console.log(result);
            fetchImportance();
        } catch (err) {
            console.error(err);
        }
    };

    const deletePlayer = async (player: Player) => {
        try {
            const response = await fetch(`${URL}/api/teams/${player.player_id}/Player`, {
                method: 'DELETE',
                credentials: "include"                
            })
            await response.json()
            fetchPlayers()
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${URL}/api/teams/${teamId}`, {
                    method: 'GET',
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const teamObj = await res.json();
                if (teamObj && user && teamObj.user_id === user.id) {
                    setTeam(teamObj);
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
                navigate('/');
            }
        }
        const fetchAll = async () => {
        try {
            // waits for all promises to finish before moving on
            await Promise.all([
                fetchTeam(),
                fetchPlayers(),
                fetchImportance()
                ]);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (user && teamId) {
            fetchAll();
        }
    }, [user, teamId]);

    return (
        <div className='bg-cyan-50'>
            {team ? (
                <>
                    <div className="-mt-15">
                        <p className=" mx-auto w-fit cursor-pointer dark:text-white mb-1 text-slate-600 uppercase text-4xl md:text-7xl font-bold font-mono text-center tracking-wide text-shadow-slate-300 text-shadow-lg dark:text-shadow-2xl dark:text-shadow-black">
                            {team.team_name} 
                        </p> 
                    </div>
                    <hr className='border-1 mb-4'/>
                    {players.length > 0 ? (
                        <div className="col-span-full flex flex-wrap justify-center gap-4 w-2/3 mx-auto my-auto">
                            {players.map((player) => (
                                <div className={`${isPlaying[player.player_name] ? "bg-zinc-100" : "text-white bg-zinc-500 opacity-[.45]"} dark:bg-slate-800 hover:scale-105 transition-discrete duration-300  px-5 h-fit shadow-md shadow-slate-500 rounded-2xl py-5`} key={player.player_name} >
                                    <div className='items-center justify-around flex flex-row gap-2 mb-3'>
                                        <AddPlayer playing={isPlaying[player.player_name]} updatePlayers={fetchPlayers} player={player} />
                                        <div onClick={() => {deletePlayer(player)}} className='cursor-pointer w-fit rounded-xl bg-gray-300 hover:bg-gray-200 hover:border-gray-500 border-gray-800 border-1 py-2'><TrashIcon className='w-fit h-7'/></div>
                                    </div>
                                    <div className='flex flex-row gap-3 my-2'>
                                        <h2>Playing</h2>
                                        <Switch.Root onCheckedChange={() => handlePlayingChange(player.player_name)} defaultChecked={isPlaying[player.player_name]} className="SwitchRootTeam">
                                            <Switch.Thumb className="SwitchThumbTeam" />
                                        </Switch.Root>
                                    </div>
                                    {player.positions && Object.entries(player.positions).map(([position, data]) => (
                                        <div key={position}>
                                            <strong>{position}:</strong> {data.label}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) :  
                    <div className='font-mono font-black text-5xl mt-70'>No Players On This Team Yet</div>
                    }
                    <br />
                </>
            ) : (
                <h2>No data</h2>
            )}
            <div className='sticky flex flex-col gap-4 items-center pb-20 md:flex-row md:justify-center'>
                {defaultPlayer && (
                    <AddPlayer playing={true} disabled={players.length >= 15} key={players.length} updatePlayers={fetchPlayers} player={defaultPlayer}/>
                )}
                <Link to={`/teams/${teamId}/optimized`} state={{team, isPlaying}}>
                    <div className="w-3xs bg-violet-300 border-2 rounded-md justify-center px-2 py-1 inline-flex h-20 select-none cursor-pointer items-center hover:bg-violet-300 transition duration-300">
                        Generate Lineup
                    </div>
                </Link>
                <ImportanceModal updateImportance={updateImportance} initialImportance={importance} />
            </div>
        </div>
    );
}

export default TeamPage;