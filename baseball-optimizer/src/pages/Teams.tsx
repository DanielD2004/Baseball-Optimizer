import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { TextField } from '@mui/material';
import DivisionSelect from '../components/DivisionSelect';
import DatePicker from '../components/DatePicker';
import TeamCard from '../components/TeamCard';
import { useGuest } from '../useGuest';

const URL = import.meta.env.VITE_NGROK_URL

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
    const { guestMode } = useGuest();

    const fetchTeams = async() => {
      try{
        const response = await fetch(`${URL}/api/teams/user/`, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        },
        credentials: "include"
      })
      const data = await response.json();
      setTeams(data);
      } catch (error) {
          console.error('Error fetching teams:', error);
        } 
    }

  const addTeam = async() => {
    if (user && division && year && teamName){
      const response = await fetch(`${URL}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          team_name: teamName,
          season: year,
          division: division
        })
      });
      await response.json();
      fetchTeams();
    }
  }

  const deleteTeam = async (team: Team) => {
      if (user){
        try {
            const response = await fetch(`${URL}/api/teams/${team.team_id}/Team`, {
                method: 'DELETE', 
                credentials:"include"               
            })
            await response.json()
            fetchTeams();
        } catch (e) {
            console.error(e)
        }
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(e.target.value);
  }

  useEffect(() => {
    if (user) {
      fetchTeams();
    } else {
      console.log("User error")
    }
  }, [user]);

  return (
    <div id="teams" className='select-none'>
      <h1 id="my-teams-header" className="select-none dark:text-white mb-1 text-slate-600 uppercase text-7xl font-bold font-mono text-center tracking-wide text-shadow-slate-300 text-shadow-lg dark:text-shadow-2xl dark:text-shadow-black">My Teams</h1>
      <hr className='border-1 mb-4'/>
      {teams.length > 0 ? (
          // y space between children
          <div className="space-y-6 flex min-w-1/2 max-w-100 mx-auto flex-wrap">
            {teams.map((team) => (
              <TeamCard key={team.team_id} deleteTeam={deleteTeam} team={team} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-6">No teams found for this user.</p>
        )}

        {guestMode && 
          <h1 className='font-bold text-xl capitalize mt-10 -mb-10'>Adding new teams is disabled. Not an authorized user </h1>
        }
       {/* better to not have increase scale on hover. Also year select brings it out of hover */}
       <div className="relative w-full max-w-fit mx-auto">

        {/* Overlay div that disables everything underneath */}
        {guestMode && (
          <div className="absolute inset-0 z-10 bg-rose-100 opacity-75 cursor-not-allowed rounded-2xl" />
        )}
        <div className={`hover:bg-zinc-50 dark:bg-slate-800 py-3 transition-discrete duration-100 bg-white shadow-md shadow-slate-500 rounded-2xl flex relative justify-center items-center flex-wrap w-100 mx-auto mt-10 select-none space-y-15 `}>
          <h1 className='dark:text-amber-500 absolute top-0 left-5 font-[500] mt-3'>Add Team:</h1>
          <div className='flex flex-col mt-8 mr-5 items-start mb-20'>
            <TextField error={teamName.length === 0} className="font-[500] rounded-lg" size="small" onChange={handleNameChange} value={teamName} label="Team Name" variant="outlined"/>
            <DatePicker setYear={setYear}/>
          </div>
          <DivisionSelect setDivision={setDivision}/>
          <div onClick={addTeam} className={`${!teamName || !division || !year ? "cursor-not-allowed bg-rose-400 opacity-50 " : "hover:bg-gray-200 cursor-pointer  bg-slate-100 "} shadow-gray-600 shadow-sm -mt-10 transition transition-duration-300 border-2 border-slate-400 rounded-lg p-2 w-fit h-10 flex justify-center items-center select-none`}>
            Add Team
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
