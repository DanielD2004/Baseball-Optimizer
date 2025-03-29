import * as React from 'react';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';

function getLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${value}`;
}

export default function PlayerRating() {
  const [value, setValue] = React.useState<number | null>(2.5);
  const [hover, setHover] = React.useState(-1);

  return (
    <Box sx={{ width: 200, display: 'flex', alignItems: 'center' }}>
      <Rating
        name="hover-feedback"
        value={value}
        precision={0.5}
        getLabelText={getLabelText}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
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
