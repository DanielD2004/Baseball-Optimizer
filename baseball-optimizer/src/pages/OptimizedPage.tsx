import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'

interface Team {
    team_id: string;
    user_id: string;
    team_name: string;
    season: string;
    division: string;
}

interface Schedule {
    objective_value: number;
    schedule: { [inning: number]: Inning };
    player_sits: { [playerName: string]: number };
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

function OptimizedPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<Schedule | null>(null);
    const [players, setPlayers] = useState();
    const [importance, setImportance] = useState();
    const location = useLocation();
    const team: Team = location.state as Team;

    const fetchPlayers = async () => {
        console.log("fetching players")
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/teams/${team.team_id}/players`, {
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
            const response = await fetch(`http://127.0.0.1:5000/api/teams/${team.team_id}/importance`, {
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
            const response = await fetch(`http://127.0.0.1:5000/api/teams/${team.team_id}/lineup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, importance }),
            });
    
            const data = await response.json();
            console.log(data);
            setResult(data);
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
        if (players && importance) {
            console.log("Players and importance are set, getting lineup")
            getLineup();
        }
    }, [players, importance]);

return (
    <div className='bg-cyan-50'>
        <h1>Optimized Lineup</h1>
        {loading == true ? (
            <div className="h-screen -mt-20 flex flex-col justify-center items-center" >
                <Ring size="75"></Ring>
                <div className='mt-5'>This may take a few moments</div>
            </div>
        ) : (
            <div className="w-screen" >
                <h2 className="schedule">Schedule</h2>
                {Object.entries(result.schedule).map(([inning, inningData]) => (
                    <div className="w-screen" key={inning}>
                        <h3 >Inning {inning}</h3>
                        <h1 className="font-bold text-xl">Field:</h1>
                        <div className="playerList">
                            {inningData.field.map((player) => (
                                <h5 key={player.id} className="player-item">
                                    {player.name} - {player.position}
                                </h5>
                            ))}
                        </div>
                        <h1 className="font-bold text-xl">Bench:</h1>
                        <ul className="playerList">
                            {inningData.bench.map((player) => (
                                <h5 key={player.id} className="player-item">{player.name}</h5>
                            ))}
                        </ul>
                        <hr className="my-3"/>
                    </div>
                ))}
            </div>
            )} 
        </div>
);
}

export default OptimizedPage