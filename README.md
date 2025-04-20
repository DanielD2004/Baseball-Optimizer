## Slowpitch Lineup Optimizer
Full-stack web app that optimizes slowpitch softball defensive lineups based on player skills, positional preferences, fairness and coaches position importance belief. Built with a React frontend and Flask backend

---
##  Features
- **Lineup Optimization:** using linear programming with PuLP
- **Position Importance:** with sliders to weigh infield/outfield weighting
- **Add & Edit Players:** with skill rating and position preferences
- **Up/Down Reordering:** to also set a batting order
- **Authentication:** with Clerk
- **MongoDB Integration:** for team, user and player data
---
## What I Used

| Layer       | Library/Framework              
|------------|---------------------------------
| Frontend   | React, TypeScript            
| UI         | Tailwind CSS, MUI, Radix UI 
| Backend    | Flask
| Optimization | PuLP
| Authentication       | Clerk                          
| Database   | MongoDB         
| Deployment | Vercel for frontend, backend local for now

---
### Optimization
- The backend uses PuLP to assign players to positions across 9 innings:
- Honors player preferences (Wants, Can, Cannot)
- Distributes sits according to fair play rule
### UI
- Uses tailwind for consistency across site
- Visual table to display sits and positions
- Rearrange rows using up and down arrow buttons
### Authentication
- Uses clerk
- Can sign up with Gmail or Facebook
### TODO
- I'd like to add a scoresheet in the future, that uses the row order from the defensive lineup
- Enhance UI
- Cleanup code
- Add more accessibility features

  


