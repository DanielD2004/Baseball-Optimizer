import React, { useEffect, useState } from "react";
import { Dialog, Switch } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Slider } from "radix-ui"
import { useLocation } from "react-router-dom"
import "./ImportanceModal.css"
import { Value } from "@radix-ui/themes/components/data-list";

interface Team {
    team_id: string;
    user_id: string;
}

const ImportanceModal = () => {
    const positions = ["1B", "2B", "3B", "SS", "P", "C", "LF", "LC", "RC", "RF"];
    const location = useLocation()
    const team: Team = location.state;
    const [importance, setImportance] = useState({
        "1B": 50,
        "2B": 50,
        "3B": 50,
        "SS": 50,
        "P": 50,
        "C": 50,
        "LF": 50,
        "LC": 50,
        "RC": 50,
        "RF": 50,
    });

    const handleValueChange = (position: string, value: number) => {
        setImportance((prev) => ({
            ...prev,
            [position]: value
        }));
    }

    const handleSubmit = async() => {
        const response = await fetch(`http://localhost:5000/api/teams/${team.team_id}/importance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: team.user_id,
                importance: importance
            })
        })

        if (!response.ok) {
            // HTTP error
            console.error(`${response.status}`);
            return;
        }

        const res = await response.json();
        console.log(res);
    }

	// entire add player dialog
    return (
        <Dialog.Root>
		<Dialog.Trigger asChild>
			<button className="Button violet">Edit Position Importance</button>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent">
				<Dialog.Title style={{position: "absolute", top: "10px", left: "15px"}} className="DialogTitle">Edit Position Importance</Dialog.Title>
				<Dialog.Description className="DialogDescription">
					Edit the importance you give to each position, this will be used to calculate the optimal defensive linup
				</Dialog.Description>
				
                <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
					{/* if theres a player, show their preferences, else show initial options */}
					{positions.map((position: string) => ( 
					<div key={position} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px" }}>
						<h2>{position}</h2>
                        {/* value is an array with one element, the value of the slider */}
						<Slider.Root onValueChange={(value: number[]) => {handleValueChange(position, value[0])}}
                                    className="SliderRoot"
                                    defaultValue={[50]}
                                    max={100}
                                    step={1}
                                >
                                    <Slider.Track className="SliderTrack">
                                        <Slider.Range className="SliderRange" />
                                    </Slider.Track>
                                    <Slider.Thumb className="SliderThumb" aria-label="Volume" />
                                </Slider.Root>
					</div>
					))}
				</div>

				<div
					style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}
				>
					<Dialog.Close asChild>
						<button className="Button green">Save changes</button>
					</Dialog.Close>
				</div>

				<Dialog.Close asChild>
					<button onClick={handleSubmit} className="IconButton" aria-label="Close">
						<Cross2Icon />
					</button>
				</Dialog.Close>

			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
    );
};

export default ImportanceModal;