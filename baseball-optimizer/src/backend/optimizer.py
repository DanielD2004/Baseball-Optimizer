import json
from flask import Flask, jsonify, request
from flask_cors import CORS
import pulp

def optimize_softball_lineup(players_data):
    """
    Optimize defensive lineup for a slowpitch softball team using integer programming.
    
    Args:
        players_data (list): List of player dictionaries
    """
    # Positions on the field
    POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF']
    INNINGS = list(range(9))
    
    # Create the linear programming problem
    prob = pulp.LpProblem("Softball_Lineup_Optimization", pulp.LpMaximize)
    
    # Decision Variables
    # x[p,i,pos] = 1 if player p plays position pos in inning i
    x = pulp.LpVariable.dicts("player_position", 
                               ((p, i, pos) 
                                for p in range(len(players_data)) 
                                for i in INNINGS 
                                for pos in POSITIONS), 
                               cat='Binary')
    
    # y[p,i] = 1 if player p sits in inning i
    y = pulp.LpVariable.dicts("player_sit", 
                               ((p, i) 
                                for p in range(len(players_data)) 
                                for i in INNINGS), 
                               cat='Binary')
    
    # z[p] = total number of innings player p sits
    z = pulp.LpVariable.dicts("total_sits", 
                               (p for p in range(len(players_data))), 
                               lowBound=0, 
                               cat='Integer')
    
    # Objective Function: Maximize skill ratings and position preferences
    obj_terms = []
    for p in range(len(players_data)):
        player = players_data[p]
        for i in INNINGS:
            for pos in POSITIONS:
                # Base skill rating for the position
                skill_rating = player.get('skillRatings', {}).get(pos, 0)
                
                # Large bonus for preferred positions (to prioritize them)
                pref_bonus = 10 if pos in player.get('preferences', []) else 0
                
                obj_terms.append((skill_rating + pref_bonus) * x[p,i,pos])
    
    # Objective: Maximize skill ratings and preference bonuses
    prob += pulp.lpSum(obj_terms)
    
    # Constraints
    
    # 1. Exactly 10 players on field each inning (one for each position)
    for i in INNINGS:
        prob += pulp.lpSum(x[p,i,pos] for p in range(len(players_data)) 
                            for pos in POSITIONS) == 10
    
    # 2. Each position must have exactly one player per inning
    for i in INNINGS:
        for pos in POSITIONS:
            prob += pulp.lpSum(x[p,i,pos] for p in range(len(players_data))) == 1
    
    # 3. Each player can only play one position per inning
    for p in range(len(players_data)):
        for i in INNINGS:
            prob += pulp.lpSum(x[p,i,pos] for pos in POSITIONS) + y[p,i] == 1
    
    # 4. No player plays the same position in multiple innings
    for p in range(len(players_data)):
        for pos in POSITIONS:
            prob += pulp.lpSum(x[p,i,pos] for i in INNINGS) <= 1
    
    # 5. No consecutive inning sits
    for p in range(len(players_data)):
        for i in range(len(INNINGS)-1):
            prob += y[p,i] + y[p,i+1] <= 1
    
    # 6. Track total sits for each player
    for p in range(len(players_data)):
        prob += z[p] == pulp.lpSum(y[p,i] for i in INNINGS)
    
    # 7. Fair sitting constraint: max difference in sits is 1
    for p1 in range(len(players_data)):
        for p2 in range(p1+1, len(players_data)):
            prob += z[p1] - z[p2] <= 1
            prob += z[p1] - z[p2] >= -1
    
    # Solve the problem
    prob.solve()
    
    # Check solution status
    if pulp.LpStatus[prob.status] != 'Optimal':
        return {"error": "No optimal solution found"}
    
    # Extract solution
    lineup = {i: {'field': {}, 'bench': []} for i in INNINGS}
    
    for i in INNINGS:
        for p in range(len(players_data)):
            if y[p,i].varValue > 0.5:
                lineup[i]['bench'].append(players_data[p]['name'])
            else:
                for pos in POSITIONS:
                    if x[p,i,pos].varValue > 0.5:
                        lineup[i]['field'][pos] = players_data[p]['name']
    
    return {
        "objective_score": pulp.value(prob.objective),
        "lineup": lineup
    }

app = Flask(__name__)
CORS(app)

@app.route('/optimize', methods=['POST'])
def optimize_lineup():
    """
    API endpoint to optimize softball lineup
    
    Expected JSON input:
    {
        "players": [
            {
                "name": "Player Name",
                "skillRatings": {"P": 8, "1B": 7, ...},
                "preferences": ["P", "1B", ...]
            },
            ...
        ]
    }
    """
    try:
        # Get players from request JSON
        players_data = request.json.get('players', [])
        
        # Validate input
        if not players_data or len(players_data) < 10:
            return jsonify({
                "error": "Not enough players. Minimum 10 players required."
            }), 400
        
        # Optimize lineup
        result = optimize_softball_lineup(players_data)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# Sample test endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)