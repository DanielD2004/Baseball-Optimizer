import React, { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./AddPlayer.css";
import Select from "react-select";
import PlayerRating from "./PlayerRating";
import { TextField } from '@mui/material';
import { useLocation } from 'react-router-dom'

type PositionOption = {
	value: string;
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
}

const AddPlayer = (data: Player) => {
	const [name, setName] = useState<string>("");
	const [rating, setRating] = useState<number>(2.5);
	const positions: string[] = ["1B", "2B", "3B", "SS", "P", "C", "LF", "LC", "RC", "RF"];
	const location = useLocation()
    const team: Team = location.state;

    const positionOptions: PositionOption[] = [
		{ value: "wantsToPlay", label: "Wants To Play" },
		{ value: "canPlay", label: "Can Play" },
		{ value: "cannotPlay", label: "Cannot Play" }
	  ]
	  
	const [selectedPositions, setSelectedPositions] = useState<{ [key: string]: PositionOption }>({});

	const handleChange = (selectedOption: PositionOption, position: string) => {
		setSelectedPositions(prev => ({
            ...prev,
            [position]:  selectedOption,
        }));
	}
	
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
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
    				positions: selectedPositions
    			})
    		  });
    		  const res = await response.json();
    		  // send emit to parent to update players
    		  updatePlayers();
    	}

	const checkSubmit = (e) => {
		if (name.trim() == "" || Object.keys(selectedPositions).length < positions.length) {
			alert("Please Fill Out All Fields");
			e.preventDefault()
		}
		else{
			AddPlayer();
		}
	}
	
	const handleRatingChange = (rating: number) => {
		setRating(rating);
	}

	useEffect(() => {
	}, [selectedPositions, name, rating]);

	// entire add player dialog
    return (
		<Dialog.Root>
		<Dialog.Trigger asChild>
			<button className="Button violet">Add Player</button>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent">
				<Dialog.Title className="DialogTitle">Add Player</Dialog.Title>
				<Dialog.Description className="DialogDescription">
					Add a player to your team, include their name, skill rating and position preferences
				</Dialog.Description>
				<fieldset className="Fieldset">
					<label className="Label" htmlFor="name">
						Name
					</label>
					<TextField style={{marginLeft: "10px"}} size="small" onChange={handleNameChange} value={name} label="Player Name" variant="outlined"/>
				</fieldset>
				<fieldset className="Fieldset">
					<label className="Label" htmlFor="rating">
						Rating
					</label>
					<PlayerRating onRatingChange={handleRatingChange}/>
				</fieldset>
				<div>
				<div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "20px"}}>
					{positions.map((position) => (
						<div key={position} style={{display: "flex", flexDirection: "row", alignItems: "center", gap: "20px"}}>
							<h2>{position}</h2>
							<Select
							options={positionOptions}
							id={position}
							defaultValue={positionOptions[2]}
							styles={{
								control: (baseStyles, state) => ({
									...baseStyles,
									width: 300,
									borderRadius: state.isFocused ? "50px" : "0px",
								}),
							}}
							onChange={(selectedOption: PositionOption) => handleChange(selectedOption, position)}
							/>	
						</div>
					))}
				</div>
				<div
					style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}
				>
					<Dialog.Close asChild>
						<button onClick={checkSubmit} className="Button green">Add Player</button>
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