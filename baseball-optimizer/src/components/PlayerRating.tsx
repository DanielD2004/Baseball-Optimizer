import React, { useEffect } from 'react';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';
import { ValueNoneIcon } from '@radix-ui/react-icons';

function getLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${value}`;
}

interface PlayerRatingProps {
  onRatingChange: (rating: number) => void;
  initialValue: number;
}

export default function PlayerRating({ onRatingChange, initialValue }: PlayerRatingProps) {
  const [value, setValue] = React.useState<number | null>(initialValue);
  const [hover, setHover] = React.useState(-1);

  const handleRatingChange = (event: React.ChangeEvent<{}>, newValue: number | null) => {
    setValue(newValue);
    onRatingChange(newValue);
  };
  
  return (
    <Box sx={{ width: 200, display: 'flex', alignItems: 'center' }}>
      <Rating
        name="hover-feedback"
        value={value}
        precision={0.5}
        getLabelText={getLabelText}
        onChange={handleRatingChange}
        onChangeActive={(event, newHover) => {
          setHover(newHover);
        }}
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
      />
      {value !== null && (
        <Box sx={{ ml: 2 }}>{hover !== -1 ? hover : value}</Box>
      )}
    </Box>
  );
}
