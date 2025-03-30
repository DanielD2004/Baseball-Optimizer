import React from "react";
import { MenuItem, Select, InputLabel, FormControl } from "@mui/material";

interface DatePickerProps {
  setYear: (year: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ setYear }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString()); // Last 50 years

  return (
    <FormControl style={{ marginLeft: "10px", minWidth: 150, marginRight: '20px' }} size="small">
      <Select onChange={(e) => setYear(e.target.value)} defaultValue="Select Year">
        <MenuItem value="Select Year">Select Year</MenuItem>
        {years.map((year) => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default DatePicker;
