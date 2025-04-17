import React from 'react';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';

function getLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${value}`;
}

interface PlayerRatingProps {
  onRatingChange: (rating: number) => void;
  initialValue: number;
}

export default function PlayerRating({ onRatingChange, initialValue }: PlayerRatingProps) {
  const [value, setValue] = React.useState<number>(initialValue);  // Set type explicitly to `number`
  const [hover, setHover] = React.useState<number>(-1);  // Track hover state as a number instead of default `-1`

  const handleRatingChange = (_: React.SyntheticEvent, newValue: number | null) => {
    if (newValue !== null) {
      setValue(newValue);
      onRatingChange(newValue);
    }
  };

  return (
    <Box sx={{ width: 200, display: 'flex', alignItems: 'center' }}>
      <Rating
        name="hover-feedback"
        value={value}
        precision={0.5}
        getLabelText={getLabelText}
        onChange={handleRatingChange}
        onChangeActive={(_, newHover: number) => setHover(newHover)} // Explicitly type `newHover` as `number`
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
      />
      {value !== null && (
        <Box sx={{ ml: 2 }}>{hover !== -1 ? hover : value}</Box>  // Display hover value if it's not -1, otherwise show actual value
      )}
    </Box>
  );
}
