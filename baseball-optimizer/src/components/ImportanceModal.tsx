import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Slider } from "radix-ui";
import "./ImportanceModal.css";

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
    const [importance, setImportance] = useState<Importance>(initialImportance);

    const handleValueChange = (position: string, value: number) => {
        setImportance((prev) => ({
            ...prev,
            [position]: value,
        }));
    };

    const handleSubmit = async () => {
        updateImportance(importance);  // use prop
    };

    useEffect(() => {
        setImportance(initialImportance); 
    }, [initialImportance]);

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <div onClick={()=> setImportance(initialImportance)} className="w-3xs bg-violet-200 border-2 rounded-md justify-center px-2 py-1 inline-flex h-20 select-none cursor-pointer items-center hover:bg-violet-300 transition duration-300">Edit Position Importance</div>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="DialogOverlay" />
                <Dialog.Content className="DialogContent bg-gray-100">
                    <Dialog.Description className="font-mono text-[17px] text-left text-lg">
                        Edit the importance you give to each position, this will be used to calculate the optimal defensive lineup.
                    </Dialog.Description>

                    <div className="mt-6 space-y-3">
                    {Object.entries(importance).map(([position, initialValue]) => (
                            <div key={position} className="flex flex-row justify-center align-center gap-2 items-center">
                                <h2 className="w-4 mr-3 text-lg font-mono font-semibold tracking-wide">{position}: </h2>
                                <Slider.Root
                                    // ts cant tell if position is one of the keys in Importance, keyof Importance works around it, tells ts that position is a key of Importance
                                    value={[importance[position as keyof Importance]]} 
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

                    <Dialog.Close asChild>
                        <div onClick={handleSubmit} className={`bg-cyan-200 w-fit mx-auto p-2 rounded-lg mt-5 hover:bg-cyan-300 transition transition-duration-300 select-none shadow-gray-600 shadow-sm`}>Save Changes</div>
                    </Dialog.Close>

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

export default ImportanceModal;