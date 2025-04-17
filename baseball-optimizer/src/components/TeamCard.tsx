import { Link } from 'react-router-dom';

interface Team {
  team_id: number;
  user_id: number;
  team_name: string;
  season: string;
  division: string;
}

interface TeamCardProps {
  team: Team;
}

const TeamCard = ({ team }: TeamCardProps) => {
  return (
    <Link
          to={`/teams/${team.team_name}/${team.season}`}
          state={team}
          className="w-full max-w-md mx-auto"
    >
    <div className="dark:bg-slate-800 hover:bg-zinc-50 hover:scale-105 transition-discrete duration-100 bg-white w-full max-w-md shadow-md shadow-slate-500 rounded-2xl p-6"> 
      <h2 className="dark:text-amber-500 text-2xl font-bold text-sky-500 mb-2">
        <span>
          {team.team_name}
        </span>
      </h2>
      <div className="dark:text-yellow-500 text-lg font-mono font-medium text-gray-700">
        {team.season} {team.division} division
      </div>
    </div>
    </Link>
  );
};

export default TeamCard;
