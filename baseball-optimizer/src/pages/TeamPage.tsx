import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import './TeamPage.css';
import AddPlayer from '../components/AddPlayer';
import ImportanceModal from '../components/ImportanceModal';

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

    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const team: Team = location.state as Team;

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

    const updateImportance = async (newImportance: Importance) => {
        try {
            const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/importance`, {
                method: 'POST',
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

    useEffect(() => {
        if (!team || !user) {
            navigate('/');
            return;
        }
        if (user && team && team.user_id !== user.id) {
            navigate('/');
        }

        fetchPlayers();
    }, [user, team]);

    useEffect(()=>{
        fetchImportance();
    }, [])

    return (
        <div>
            {team ? (
                <>
                    <div className="team-bio">
                        <h1>{team.division}</h1>
                        <h2>
                            <Link to={`/teams/${team.team_name}/${team.season}/optimized`} state={team}>{team.team_name}</Link>  
                        </h2>
                        <h1>{team.season}</h1>
                    </div>
                    {players.length > 0 && (
                        <>
                            <h2>Players:</h2>
                            <div style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: "20px",
                                maxWidth: "800px",
                                margin: "0 auto"
                            }}>
                                {players.map((player) => (
                                    <div style={{ minWidth: "150px", textAlign: "center", borderRight: "1px solid black", borderLeft: "1px solid black" }} key={player.player_name} >
                                        <AddPlayer updatePlayers={fetchPlayers} player={player} />
                                        {player.positions && Object.entries(player.positions).map(([position, data]) => (
                                            <div key={position}>
                                                <strong>{position}:</strong> {data.label}
                                            </div>
                                        ))}
                                        <br /><br />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    <br />
                    <AddPlayer key={players.length} updatePlayers={fetchPlayers} player={defaultPlayer} />
                </>
            ) : (
                <h2>No data</h2>
            )}
            <div style={{ position: "absolute", bottom: "50vh", margin: "20px", right: 50, width: "150px", height: "150px" }}>
                <ImportanceModal updateImportance={updateImportance} initialImportance={importance} />
            </div>
        </div>
    );
}

export default TeamPage;