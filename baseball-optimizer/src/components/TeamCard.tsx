import { Link } from 'react-router-dom';
import { TrashIcon } from '@radix-ui/react-icons';

interface Team {
  team_id: number;
  user_id: number;
  team_name: string;
  season: string;
  division: string;
}

interface TeamCardProps {
  team: Team;
  deleteTeam: (team: Team) => void;
}

const TeamCard = ({ team, deleteTeam }: TeamCardProps) => {
  return (
    <Link
          to={`/teams/${team.team_name}/${team.season}`}
          state={team}
          className="w-full max-w-md mx-auto"
    >
      <div className="dark:bg-slate-800 hover:bg-zinc-50 hover:scale-105 transition-discrete duration-100 bg-white w-full max-w-md shadow-md shadow-slate-500 rounded-2xl py-5 px-6 items-center flex flex-col"> 
        <div className='flex flex-row gap-3 items-center justify-center'>
          <h2 className="dark:text-amber-500 text-2xl font-bold text-sky-500 mb-2 mt-2">
            <span>
              {team.team_name}
            </span>
          </h2>
          <div onClick={(e) => {deleteTeam(team); e.preventDefault()}} className='cursor-pointer w-fit rounded-xl bg-gray-300 hover:bg-gray-200 hover:border-gray-500 border-gray-800 border-1 py-2'><TrashIcon className='w-fit h-7'/></div>
        </div>
        <div className="dark:text-yellow-500 text-lg font-mono font-medium text-gray-700">
          {team.season} {team.division} division
        </div>
      </div>
    </Link>
  );
};

export default TeamCard;
