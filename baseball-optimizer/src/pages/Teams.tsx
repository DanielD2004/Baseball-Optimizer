import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { InputLabel, TextField, Button } from '@mui/material';
import DivisionSelect from '../components/DivisionSelect';
import DatePicker from '../components/DatePicker';

interface Team {
  team_id: number;
  user_id: number;
  team_name: string;
  season: string;
  division: string;
  }

const Teams = () => {
    const { user } = useUser() 
    const [division, setDivision] = useState<string>('');
    const [year, setYear] = useState<string | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamName, setTeamName] = useState<string>('');

    const fetchTeams = async(userID: string) => {
      try{
        const response = await fetch(`http://127.0.0.1:5000/api/teams/${userID}`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        }
    })
    const data = await response.json();
    setTeams(data);
    } catch (error) {
        console.error('Error fetching teams:', error);
      } 
    }

  const addTeam = async() => {
    if (user && division && year){
      const response = await fetch(`http://127.0.0.1:5000/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          team_name: teamName,
          season: year,
          division: division
        })
      });
      const res = await response.json();
      fetchTeams(user.id);
    }
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(e.target.value);
  }

  useEffect(() => {
    console.log(teams)
    if (user) {
      fetchTeams(user.id);
    } else {
      console.log("User error")
    }
  }, [user, division]);

  return (
    <div id="teams">
      <h1 id="my-teams-header" style={{}}>My Teams</h1>
      <hr/>
      {teams.length > 0 ? (
        <div>
          {teams.map((team: Team) => (
            <div key={team.team_id}>
              <h2>
                <Link to={`/teams/${team.team_name}/${team.season}`} state={team}>{team.team_name}</Link>  
              </h2>
              <div style={{marginTop: "-20px"}}>
                <span>Season: {team.season}</span>
                <br/>
                <span>League: {team.division}</span>
                <br/>
              </div>
              <hr/>
            </div>
          ))}
        </div>
      ) : (
        <p>No teams found for this user.</p>
      )}

       <div style={{ display: "flex", width: "100vw", marginTop: "20px", alignItems: "center", justifyContent: "center"}}>
        <InputLabel>Add Team:</InputLabel>
        <TextField style={{marginLeft: "10px"}} size="small" onChange={handleNameChange} value={teamName} label="Team Name" variant="outlined"/>
        <DatePicker setYear={setYear}/>
        <DivisionSelect setDivision={setDivision}/>
        <Button variant="contained" onClick={addTeam} style={{marginLeft: "50px"}}>Add Team</Button>
      </div>
    </div>
  );
};

export default Teams;