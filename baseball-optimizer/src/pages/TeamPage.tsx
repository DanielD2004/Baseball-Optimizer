import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import './TeamPage.css'
import AddPlayer from '../components/AddPlayer'

interface Team {
    team_id: string;
    user_id: string;
    team_name: string;
    season: string;
    division: string;
}

interface Player {
    name: string;
    team_id: string;
    skill: number;
}

function TeamPage() {
    // const { teamName, season, division } = useParams<{teamName: string; season: string; division: string}>();
    const [players,setPlayers] = useState([])
    const { user } = useUser() 
    const navigate = useNavigate()
    const location = useLocation()
    const team: Team = location.state;

    const fetchPlayers = async () =>{
        try {
            const response = await fetch(`http://localhost:5000/teams/${team.team_id}/players`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (data){
            setPlayers(data)
        }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {     
        if (!team || !user){
            navigate('/');
            return;
        }
        if (user && team && team.user_id !== user.id) {
            navigate('/');
        }
        fetchPlayers();
    }, [user, team, navigate]);

    return (
        <div>
            {team ? (
                <>
                    <div className="team-bio">
                        <h1>{team.team_name}</h1>
                        <h1>{team.division}</h1>
                        <h1>{team.season}</h1>
                    </div>
                    {players.length > 0 && ( <div>
                        <h2>Players:</h2>
                        {players.map((player: Player) => {
                            return(<h1 key={player.name}>{player.name}</h1>)
                        })}
                    </div>
                    )}
                    <AddPlayer/>
                </>
            ) : (
                <h2>No data</h2>
            )
        }
        </div>
    ) 
}

export default TeamPage