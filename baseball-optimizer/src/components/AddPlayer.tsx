import React, { useEffect, useState } from "react";
import { Dialog, Switch } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./AddPlayer.css";
import Select from "react-select";
import PlayerRating from "./PlayerRating";
import { TextField } from '@mui/material';
import { useLocation } from 'react-router-dom'

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
}

const AddPlayer = ({updatePlayers, player}: AddPlayerProps) => {
	const [name, setName] = useState<string>(player.player_name);
	const genderinit = player.gender;
	const [rating, setRating] = useState<number>(player.skill);
	const [selectedPositions, setSelectedPositions] = useState<{ [key: string]: PositionOption }>(player.positions);
	const [gender, setGender] = useState<string>(genderinit);
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
			const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/players/update`, {
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
    		const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/players`, {
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
    		  const res = await response.json();

			  // send emit to parent to update players
    		  updatePlayers();
    	}

	const checkSubmit = (e: React.MouseEvent<MouseEvent>) => {
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
			<button className="Button violet">{player.default ? "Add a Player" : player.player_name}</button> 
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent">
				<Dialog.Title className="DialogTitle">{player.default ? "Add Player" : "Update Player"}</Dialog.Title>
				<Dialog.Description className="DialogDescription">
					{player.default ? "Add a player to your team, include their name, skill rating and position preferences" : ""}
				</Dialog.Description>

				<fieldset className="Fieldset">
					<label className="Label" htmlFor="name">
						Name
					</label>
					<TextField style={{marginLeft: "10px"}} size="small" onChange={handleNameChange} value={name} label={player.default ? "Add Player" : player.player_name} variant="outlined"/>
					<label className="Label" htmlFor="gender">Male:</label>
					<Switch.Root onCheckedChange={handleGenderChange} defaultChecked={player.gender !== "Male"} className="SwitchRoot" id="gender-switch" >
						<Switch.Thumb className="SwitchThumb" />
					</Switch.Root>
					<label style={{marginLeft: "-10%"}} className="Label" htmlFor="gender">Female</label>
				</fieldset>

				<fieldset className="Fieldset">
					<label style={{marginLeft: "-8%"}} className="Label" htmlFor="rating">
						Rating
					</label>
					<PlayerRating initialValue={player.default ? 2.5 : player.skill} onRatingChange={handleRatingChange}/>
				</fieldset>
				
				<div>
				<div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
					{/* if theres a player, show their preferences, else show initial options */}
					{Object.entries(player.positions).map(([key, {label} ]) => ( 
					<div key={key} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px" }}>
						<h2>{key}</h2>
						<Select
							options={positionOptions}
							id={key}
							defaultValue={{ label }}
							styles={{
								control: (baseStyles, state) => ({
									...baseStyles,
									width: 300,
									borderRadius: state.isFocused ? "50px" : "0px",
								}),
							}}
							onChange={(selectedOption: PositionOption) => handleChange(selectedOption, key)}
						/>	
					</div>
					))}
				</div>
				<div
					style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}
				>
					<Dialog.Close asChild>
						<button onClick={checkSubmit} className="Button green">{player.default ? "Add Player" : "Update Player"}</button>
					</Dialog.Close>
				</div>
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