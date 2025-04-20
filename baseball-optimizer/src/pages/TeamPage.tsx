import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import AddPlayer from '../components/AddPlayer';
import ImportanceModal from '../components/ImportanceModal';
import { Switch } from "radix-ui";
import "./TeamPage.css"

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
    const [players, setPlayers] = useState<Player[]>([]);
    const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({})
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const team: Team = location.state as Team;
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

    const defaultPlayer: Player = {
        player_name: "",
        team_id: team.team_id,
        skill: 2.5,
        positions: {
            "1B": positionOptions[2],
            "2B": positionOptions[2],
            "3B": positionOptions[2],
            "SS": positionOptions[2],
            "P": positionOptions[2],
            "C": positionOptions[2],
            "LF": positionOptions[2],
            "LC": positionOptions[2],
            "RC": positionOptions[2],
            "RF": positionOptions[2],
        },
        default: true,
        gender: "Male"
    };

    const fetchPlayers = async () => {
        try {
            const response = await fetch(`${URL}/api/teams/${team.team_id}/players`, {
                method: 'GET',
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
        }))}
    )

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
            const response = await fetch(`${URL}/api/teams/${team.team_id}/importance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user ? user.id : "",
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
        console.log(isPlaying)
    }, [isPlaying])
    return (
        <div className='bg-cyan-50'>
            {team ? (
                <>
                    <div className="-mt-15">
                        <p className=" mx-auto w-fit cursor-pointer dark:text-white mb-1 text-slate-600 uppercase text-4xl md:text-7xl font-bold font-mono text-center tracking-wide text-shadow-slate-300 text-shadow-lg dark:text-shadow-2xl dark:text-shadow-black" /* to={`/teams/${team.team_name}/${team.season}/optimized`} state={team}*/>
                        {team.team_name} 
                        </p> 
                    </div>
                    <hr className='border-1 mb-4'/>
                    {players.length > 0 ? (
                                <div className="col-span-full flex flex-wrap justify-center gap-4 w-2/3 mx-auto my-auto">
                                    {players.map((player) => (
                                        //player card
                                        <div className={`${isPlaying[player.player_name] ? "bg-zinc-100" : "text-white bg-zinc-500 opacity-[.45]"} dark:bg-slate-800 hover:scale-105 transition-discrete duration-300  px-5 h-fit shadow-md shadow-slate-500 rounded-2xl py-5`} key={player.player_name} >
                                            <AddPlayer playing={isPlaying[player.player_name]} updatePlayers={fetchPlayers} player={player} />
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
                    ): 
                    <div className='font-mono font-black text-5xl mt-70'>No Players On This Team Yet</div>
                    }
                    <br />
                    
                </>
            ) : (
                <h2>No data</h2>
            )}
            <div className='sticky flex flex-col gap-4 items-center pb-20 md:flex-row md:justify-center'>
                <AddPlayer disabled={players.length >= 15} key={players.length} updatePlayers={fetchPlayers} player={defaultPlayer} />
                <Link to={`/teams/${team.team_name}/${team.season}/optimized`} state={{team, isPlaying}}>
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