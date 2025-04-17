import * as React from "react";
import { RadioGroup } from "radix-ui";
import "./DivisionSelect.css";

interface DivisionSelectProps {
	//setDivison changes the division value from parent component
	setDivision: (division: string) => void;
}

const DivisionSelect: React.FC<DivisionSelectProps> = ({ setDivision }) => {
	//when value changes, call setDivision with the new value
	const handleValueChange = (value: string) => {
		setDivision(value);
	};
	
	return (
		<form>
			<RadioGroup.Root
				className="RadioGroupRoot"
				defaultValue="default"
				aria-label="View density"
				onValueChange={handleValueChange}
			>
				<div className='flex align-center'>
					<RadioGroup.Item className="RadioGroupItem" value="Mixed" id="r1">
						<RadioGroup.Indicator className="RadioGroupIndicator" />
					</RadioGroup.Item>
					<label className="ml-2 font-[450] tracking-wide text-sky-500 text-md uppercase tracking-wide font-semibold" htmlFor="r1">
						Mixed
					</label>
				</div>
				<div className='flex align-center'>
					<RadioGroup.Item className="RadioGroupItem" value="Mens" id="r2">
						<RadioGroup.Indicator className="RadioGroupIndicator" />
					</RadioGroup.Item>
					<label className="ml-2 font-[450] tracking-wide text-sky-500 text-md uppercase tracking-wide font-semibold" htmlFor="r2">
						Mens
					</label>
				</div>
				<div className='flex align-center'>
					<RadioGroup.Item className="RadioGroupItem" value="Masters" id="r3">
						<RadioGroup.Indicator className="RadioGroupIndicator" />
					</RadioGroup.Item>
					<label className="ml-2 font-[450] tracking-wide text-sky-500 text-md uppercase tracking-wide font-semibold" htmlFor="r3">
						Masters
					</label>
				</div>
				<div className='flex align-center'>
					<RadioGroup.Item className="RadioGroupItem" value="Ladies" id="r4">
						<RadioGroup.Indicator className="RadioGroupIndicator" />
					</RadioGroup.Item>
					<label className="ml-2 font-[450] tracking-wide text-sky-500 text-md uppercase tracking-wide font-semibold" htmlFor="r4">
						Ladies
					</label>
				</div>
			</RadioGroup.Root>
		</form>
	)
}

export default DivisionSelect;