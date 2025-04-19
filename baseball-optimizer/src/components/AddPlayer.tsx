import React, { useEffect, useState } from "react";
import { Dialog, Switch } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./AddPlayer.css";
import Select from "react-select";
import PlayerRating from "./PlayerRating";
import { TextField } from '@mui/material';
import { useLocation } from 'react-router-dom'

const URL = import.meta.env.NGROK_URL

type PositionOption = {
	label: string;
  }

interface Team {
    team_id: string;
    user_id: string;
    team_name: string;
    season: string;
    division: string;
}

interface Player {
    player_name: string;
    team_id: string;
    skill: number;
    positions: {[key: string]: PositionOption};
	player_id?: string;
	default: boolean;
	gender: string;
}

interface AddPlayerProps {
	updatePlayers: () => void;
	player: Player;
	disabled?: boolean;
}

const AddPlayer = ({ updatePlayers, player, disabled}: AddPlayerProps) => {
	const [name, setName] = useState<string>(player.player_name);
	const [rating, setRating] = useState<number>(player.skill);
	const [selectedPositions, setSelectedPositions] = useState<{ [key: string]: PositionOption }>(player.positions);
	const [gender, setGender] = useState<string>(player.gender);
	const location = useLocation()
    const team: Team = location.state;

	const positionOptions: PositionOption[] = [
		// maybe fix this one day
		{ label: "Wants To Play" },
		{ label: "Can Play" },
		{ label: "Cannot Play" }
	]
	
	const handleChange = (selectedOption: PositionOption, position: string) => {
		setSelectedPositions(prev => ({
            ...prev,
            [position]:  selectedOption,
        }));
	}
	
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	};

	const updatePlayer = async () => {
		if (!player) return;
		try {
			const response = await fetch(`${URL}/api/teams/${team.team_id}/players/update`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					player_id: player.player_id,
					player_name: name,
					skill: rating,
					positions: selectedPositions,
					gender: gender
				})
			})
			
			if (!response.ok) {
				// HTTP error
				console.error(`${response.status}`);
				return;
			}
	
			const res = await response.json();
			console.log(res);
			// console.log(test)
			updatePlayers();
		} catch (error) {
			console.error(error);
		}
	};

	const AddPlayer = async() => {
    		const response = await fetch(`${URL}/api/teams/${team.team_id}/players`, {
    			method: 'POST',
    			headers: {
    			  'Content-Type': 'application/json',
    			},
    			body: JSON.stringify({
    				player_name: name,
    				skill: rating,
    				positions: selectedPositions,
					gender: gender
    			})
    		  });
    		  await response.json();

			  // send emit to parent to update players
    		  updatePlayers();
    	}

	const checkSubmit = (e: React.MouseEvent<HTMLDivElement>) => {
		if (name.trim() == "") {
			alert("Please Fill Out All Fields");
			e.preventDefault()
			return;
		}
		else{
			if(player.default) {
				AddPlayer();
				return
			}
			updatePlayer(); 
		}
	}
	
	const handleGenderChange = (checked: boolean) => {
		setGender(checked ? "Female" : "Male"); 
	}
	
	const handleRatingChange = (rating: number) => {
		setRating(rating);
	}
	
	useEffect(() => {
	}, []);

	// entire add player dialog
    return (
		<Dialog.Root>
		<Dialog.Trigger asChild>
			<div className={`rounded cursor-pointer select-none inline-flex items-center justify-center p-2 hover:bg-violet-300 transition duration-300 ${player.default ? 'border-2 h-20 w-3xs' : 'mb-1'} ${disabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed pointer-events-none' : 'bg-violet-200 hover:bg-violet-300 text-gray-700'}`}> {player.default ? 'Add a Player' : player.player_name}</div>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent bg-gray-100">
				<Dialog.Title className="text-left font-extrabold ml-5 text-lg font-mono tracking-wide">{player.default ? "Add Player" : "Update Player"}</Dialog.Title>
				<Dialog.Description className="text-left ml-5 my-2 font-mono tracking-tight">
					{player.default ? "Add a player to your team, include their name, skill rating and position preferences" : ""}
				</Dialog.Description>

				<fieldset className="Fieldset">
					<label className="Label" htmlFor="name">
						Name
					</label>
					<div className="bg-white">
						<TextField size="small" onChange={handleNameChange} value={name} label={player.default ? "Add Player" : player.player_name} variant="outlined"/>
					</div>
					<label className="Label" htmlFor="gender">Male:</label>
					<Switch.Root onCheckedChange={handleGenderChange} defaultChecked={player.gender !== "Male"} className="SwitchRoot" id="gender-switch" >
						<Switch.Thumb className="SwitchThumb" />
					</Switch.Root>
					<label className="Label" htmlFor="gender">Female</label>
				</fieldset>

				<fieldset className="Fieldset">
					<div className="flex justify-center items-center align-center mx-auto">
					<label className="Label mr-3" htmlFor="rating">
						Rating
					</label>
						<PlayerRating initialValue={player.default ? 2.5 : player.skill} onRatingChange={handleRatingChange}/>
					</div>
				</fieldset>
				
				<div className="space-y-3">
					{/* if theres a player, show their preferences, else show initial options */}
					{Object.entries(player.positions).map(([key, {label} ]) => ( 
					<div key={key} className="flex flex-row items-center justify-center gap-8">
						<h2 className="w-4 font-[550] text-xl tracking-wide ">{key}</h2>
						<Select
							options={positionOptions}
							id={key}
							defaultValue={{ label }}
							styles={{
								control: (baseStyles) => ({
									...baseStyles,
									minWidth: 300,
									borderRadius: "10px",
								}),
							}}
							onChange={(selectedOption) => {
								if (selectedOption){ 
								handleChange(selectedOption, key)
							} 
						}}/>	
					</div>
					))}
				</div>
				<div>
					<Dialog.Close asChild>
						<div onClick={checkSubmit} className="bg-cyan-200 w-fit mx-auto p-2 rounded-lg mt-5 hover:bg-cyan-300 transition transition-duration-300 select-none shadow-gray-600 shadow-sm">{player.default ? "Add Player" : "Update Player"}</div>
					</Dialog.Close>
				</div>
				<Dialog.Close asChild>
					<button className="IconButton" aria-label="Close">
						<Cross2Icon />
					</button>
				</Dialog.Close>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
    );
};

export default AddPlayer;