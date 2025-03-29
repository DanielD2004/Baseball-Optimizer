import React from "react"
import { useState } from "react";
// import PositionRatings from "./PositionRatings";
import Select from "react-select"

type PositionOption = {
  value: string;
  label: string;
}

const positions: PositionOption[] = [
  { value: "1B", label: "1B" },
  { value: "2B", label: "2B" },
  { value: "3B", label: "3B" },
  { value: "SS", label: "SS" },
  { value: "P", label: "P" },
  { value: "C", label: "C" },
  { value: "LF", label: "LF" },
  { value: "LC", label: "LC" },
  { value: "RC", label: "RC" },
  { value: "RF", label: "RF" },
]

const PositionSelect = () => {
  // selected positions is of type PositionOption[]
  const [selectedPositions, setSelectedPositions] = useState<PositionOption[]>([]);

  const handleChange = (selectedOptions) => {
    setSelectedPositions(selectedOptions);
  };

  return (
    <div>
      <Select
        options={positions}
        isMulti
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            width: 500,
            borderRadius: state.isFocused ? "50px" : "0px",
          }),
        }}
        onChange={handleChange}
      />
      <div id="chosenPositions" style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {selectedPositions.length > 0 && <h3>Selected Positions:</h3>}
          {selectedPositions.map((option) => (
            <div style={{display: "flex"}}>
              <h4 style={{marginRight: "10px"}} key={option.value}>{option.label}</h4>
              {/* <PositionRatings /> */}
            </div>
          ))}
      </div>
      
    </div>
  );
};

export default PositionSelect;