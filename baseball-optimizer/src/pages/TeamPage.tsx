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

type PositionOption = {
	label: string;
  }

interface Player {
    player_name: string;
    team_id: string;
    skill: number;
    positions: {[key: string]: PositionOption};
    player_id?: string;
    default: boolean;
}



function TeamPage() {
    const [players,setPlayers] = useState([])
    const { user } = useUser() 
    const navigate = useNavigate()
    const location = useLocation()
    const team: Team = location.state;

    const positionOptions: PositionOption[] = [
		// maybe fix this one day
		{ label: "Wants To Play" },
		{ label: "Can Play" },
		{ label: "Cannot Play" }
	]

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
            default: true
    }

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
            setPlayers(data);
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
    }, [user, team]);

    return (
        <div>
            {team ? (
                <>
                    <div className="team-bio">
                        <h1>{team.division}</h1>
                        <h1>{team.team_name}</h1>
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
                        {players.map((player: Player) => (
                            <div style={{ minWidth: "150px", textAlign: "center", borderRight: "1px solid black", borderLeft: "1px solid black" }} key={player.player_name} > 
                                <AddPlayer updatePlayers={fetchPlayers} player={player}/>
                                {player.positions && Object.entries(player.positions).map(([position, data]) => (
                                    <div key={position}>
                                        <strong>{position}:</strong> {data.label}
                                    </div> 
                                ))}
                                <br/><br/>
                            </div>
                        ))}
                    </div>
                    </>
                    )}
                    <br/>
                    <AddPlayer updatePlayers={fetchPlayers} player={defaultPlayer}/>
                </>
            ) : (
                <h2>No data</h2>
            )
        }
        </div>
    ) 
}

export default TeamPage