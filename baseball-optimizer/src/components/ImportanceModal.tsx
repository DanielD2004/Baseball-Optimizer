import React, { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Slider } from "radix-ui";
import "./ImportanceModal.css";

interface Team {
    team_id: string;
    user_id: string;
}

interface Importance {
    "1B": number;
    "2B": number;
    "3B": number;
    "SS": number;
    "P": number;
    "C": number;
    "LF": number;
    "LC": number;
    "RC": number;
    "RF": number;
}

interface ImportanceModalProps {
    updateImportance: (newImportance: Importance) => void;
    initialImportance: Importance;
}

const ImportanceModal = ({ updateImportance, initialImportance }: ImportanceModalProps) => {
    const [open, setOpen] = useState(false);
    const [importance, setImportance] = useState<Importance>(initialImportance);

    const handleValueChange = (position: string, value: number) => {
        setImportance((prev) => ({
            ...prev,
            [position]: value,
        }));
    };

    const handleSubmit = async () => {
        updateImportance(importance);  // use prop
        setOpen(false); // close the modal after update
    };

    useEffect(() => {
        setImportance(initialImportance); 
    }, [initialImportance]);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <div className="w-3xs bg-violet-200 border-2 rounded-md justify-center px-2 py-1 inline-flex h-20 select-none cursor-pointer items-center hover:bg-violet-300 transition duration-300">Edit Position Importance</div>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="DialogOverlay" />
                <Dialog.Content className="DialogContent bg-gray-100">
                    {/* <Dialog.Title className="font-mono tracking-tight text-left font-bold text-lg -mt-2">Edit Position Importance</Dialog.Title> */}
                    <Dialog.Description className="font-mono text-[17px] text-left text-lg">
                        Edit the importance you give to each position, this will be used to calculate the optimal defensive lineup.
                    </Dialog.Description>

                    <div className="mt-6 space-y-3">
                    {Object.entries(importance).map(([position, initialValue]) => (
                            <div key={position} className="flex flex-row justify-center align-center gap-2 items-center">
                                <h2 className="w-4 mr-3 text-lg font-mono font-semibold tracking-wide">{position}: </h2>
                                <Slider.Root
                                    value={[importance[position]]}  // Controlled value
                                    onValueChange={(value) => handleValueChange(position, value[0])}
                                    className="SliderRoot"
                                    max={100}
                                    min={0}
                                    step={1}
                                >
                                    <Slider.Track className="SliderTrack">
                                        <Slider.Range className="SliderRange" />
                                    </Slider.Track>
                                    <Slider.Thumb className="SliderThumb" aria-label="Volume" />
                                </Slider.Root>
                                <h2 className="w-4 ml-2 text-lg font-mono font-semibold italic tracking-wide">{initialValue}%</h2>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
                        <button onClick={handleSubmit} className="Button green">Save changes</button>
                    </div>

                    <button onClick={() => setOpen(false)} className="IconButton" aria-label="Close">
                        <Cross2Icon />
                    </button>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default ImportanceModal;