import React, { useEffect, useState } from "react";
import { Dialog, Switch } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./AddPlayer.css";
import Select from "react-select";
import PlayerRating from "./PlayerRating";
import { TextField } from '@mui/material';
import { useParams } from 'react-router-dom'

const URL = import.meta.env.VITE_NGROK_URL

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
	gender: string;
}

interface AddPlayerProps {
	updatePlayers: () => void;
	player: Player;
	disabled?: boolean;
	playing?: boolean;
}

const AddPlayer = ({ updatePlayers, player, disabled, playing}: AddPlayerProps) => {
	const [name, setName] = useState<string>(player.player_name);
	const [rating, setRating] = useState<number>(player.skill);
	const [selectedPositions, setSelectedPositions] = useState<{ [key: string]: PositionOption }>(player.positions);
	const [gender, setGender] = useState<string>(player.gender);
	const { teamId } = useParams<{ teamId: string }>(); 

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
		setName(e.target.value.trim());
	};

	const updatePlayer = async () => {
		if (!player) return;
		try {
			const response = await fetch(`${URL}/api/teams/${teamId}/players/update`, {
				method: 'POST',
				credentials: "include",
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
			updatePlayers();
		} catch (error) {
			console.error(error);
		}
	};

	const AddPlayer = async() => {
    		const response = await fetch(`${URL}/api/teams/${teamId}/players`, {
    			method: 'POST',
				credentials: "include",
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

	const checkSubmit = () => {
		if(player.default) {
			AddPlayer();
			return
		}
		updatePlayer(); 
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
			<div className={`${disabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed pointer-events-none opacity-75 text-white border-black' : `${playing ? "bg-violet-200" : "bg-black text-white"}`} rounded cursor-pointer select-none inline-flex items-center justify-center p-2 hover:bg-violet-300 transition duration-300  ${player.default ? 'border-2 h-20 w-3xs' : 'mb-1'} `}> {player.default ? 'Add a Player' : player.player_name}</div>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent bg-gray-100">
				<Dialog.Title className="text-left font-extrabold ml-5 text-lg font-mono tracking-wide">{player.default ? "Add Player" : "Update Player"}</Dialog.Title>
				<Dialog.Description className="text-left ml-5 mb-6 my-2 font-mono tracking-tight">
					{player.default ? "Add a player to your team, include their name, skill rating and position preferences" : ""}
				</Dialog.Description>

				<fieldset className="Fieldset">
					<label className="Label select-none" htmlFor="name">
						Name
					</label>
					<div className="bg-white">
						<TextField size="small" error={name.length == 0} onChange={handleNameChange} value={name} label={player.default ? "Add Player" : player.player_name} variant="outlined"/>
					</div>

					<label className="Label" htmlFor="gender">Male:</label>
					<Switch.Root onCheckedChange={handleGenderChange} defaultChecked={player.gender !== "Male"} className="SwitchRoot">
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
					
					{/* if name is "", cursor changes to disabled and clicks arent allowed, else its normal */}
					{/* doing it this way means no transition, but cursor disabled looks better i think */}
					{name.length === 0 ? (
						<div className={`${name.length === 0 ? "cursor-not-allowed w-fit mx-auto" : ""}`}>
							<div onClick={checkSubmit} className={`${name.length === 0 ? "pointer-events-none bg-red-300 opacity-50" : ""} bg-cyan-200 w-fit mx-auto p-2 rounded-lg mt-5 hover:bg-cyan-300 transition transition-duration-300 select-none shadow-gray-600 shadow-sm`}>{player.default ? "Add Player" : "Update Player"}</div>
						</div>
					) : (
						<Dialog.Close asChild>
							<div onClick={checkSubmit} className={`bg-cyan-200 w-fit mx-auto p-2 rounded-lg mt-5 hover:bg-cyan-300 transition transition-duration-300 select-none shadow-gray-600 shadow-sm`}>{player.default ? "Add Player" : "Update Player"}</div>
						</Dialog.Close>
					)}
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