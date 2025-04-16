import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { InputLabel, TextField } from '@mui/material';
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
      <h1 id="my-teams-header" className="text-slate-600 uppercase text-7xl font-bold font-mono text-center tracking-wide">My Teams</h1>
      <hr className='border-1'/>
      {teams.length > 0 ? (
        <div>
          {teams.map((team: Team) => (
            <div key={team.team_id} className='border-l-2 border-r-2 border-b-2 border-dashed border-black w-1/6 p-5 mx-auto' >
              <h2 className='mt-4 mb-4 font-bold text-2xl text-sky-500'>
                <Link to={`/teams/${team.team_name}/${team.season}`} state={team} className='hover:text-blue-600 p-2 rounded-2xl border-3 border-gray-400 bg-gray-100 hover:bg-gray-200 hover:border-gray-500'>{team.team_name}</Link>  
              </h2>
              <div className='font-mono font-[550] text-lg tracking-wide'>
                <span>{team.season} {team.division} division</span>
                <br/>
              </div>
              {/* <hr className="border-1 border-black w-1/4 mx-auto" /> */}
            </div>
          ))}
        </div>
      ) : (
        <p>No teams found for this user.</p>
      )}

       <div className="flex justify-center items-center w-full mt-10 select-none">
        <h1 className='mr-3 font-[500]'>Add Team:</h1>
        <TextField className="font-[500] rounded-lg" size="small" onChange={handleNameChange} value={teamName} label="Team Name" variant="outlined"/>
        <DatePicker setYear={setYear}/>
        <DivisionSelect setDivision={setDivision}/>
        {/* <Button variant="contained" onClick={addTeam}>Add Team</Button> */}
        <div className='ml-3 border-2 border-slate-400 bg-slate-100 hover:bg-gray-200 rounded-lg p-2 w-fit h-10 flex justify-center items-center cursor-pointer select-none'>
          <button onClick={addTeam}>Add Team</button>
        </div>
      </div>
    </div>
  );
};

export default Teams;