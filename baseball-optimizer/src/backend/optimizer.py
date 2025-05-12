import json
import os
import pulp as pl
from flask_cors import CORS
from tabulate import tabulate
from flask import Flask, request, jsonify, session, render_template, make_response
import logging
import time
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from pymongo.server_api import ServerApi
import os
import requests
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import authenticate_request, AuthenticateRequestOptions
import httpx

load_dotenv()
app = Flask(__name__)

# otherwise, blocks cookie from frontend
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True
)
app.secret_key = os.getenv("FLASK_SECRET_KEY")
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)
clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))
uri = os.getenv("MONGO_URI")
client = MongoClient(uri, server_api=ServerApi('1'))
db = client["Optimizer"]

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

def optimize_softball_lineup(team_data):
    """
    Optimize defensive lineup for a slowpitch softball team using linear programming.
    Creates fair schedule ensuring balanced play time and respecting position preferences.

    Args:
        team_data (dict): Dictionary containing player data, position preferences, and position importance

    Returns:
        dict: Optimized schedule and objective value if found, or error message
    """
    # app.logger.debug(f"Team data received: {team_data}")
    
    # Extract players and position importance from input data with error handling
    try:
        players = team_data.get("players", [])
        position_importance = team_data.get("importance", {})  # Dictionary mapping positions to their importance values
    except (KeyError, AttributeError) as e:
        err_msg = f"Invalid team data format: {str(e)}"
        app.logger.error(err_msg)
        return {"success": False, "message": err_msg}

    if not players:
        return {"success": False, "message": "No players found in team data"}

    # Pre-process player data: add unique IDs and standardize gender format
    for i, player in enumerate(players):
        player["id"] = f"p{i+1}"  # Create unique identifier for each player
        
        # Standardize gender notation to single letter format (M/F)
        if "gender" in player:
            if player["gender"] == "Female":
                player["gender"] = "F"
            elif player["gender"] == "Male":
                player["gender"] = "M"

    # Define available positions and innings
    positions = ["P", "C", "1B", "2B", "3B", "SS", "LF", "LC", "RC", "RF"] 
    innings = list(range(1, 10))
    num_innings = len(innings)
    num_players = len(players)

    # Initialize problem, maximize our objective
    prob = pl.LpProblem("Softball_Lineup_Optimization", pl.LpMaximize)
    
    # playerPosition[player_id, inning, position] = 1 if player plays that position in that inning, 0 otherwise
    # example: playerPosition["p3", 2, "SS"] = 1 means player p3 plays shortstop in inning 2
    playerPosition = {(p["id"], i, pos): pl.LpVariable(f"playerPosition_{p['id']}_{i}_{pos}", cat=pl.LpBinary)
         for p in players for i in innings for pos in positions}

    # sit[player_id, inning] = 1 if player sits out during that inning, 0 if they play
    sit = {(p["id"], i): pl.LpVariable(f"sit_{p['id']}_{i}", cat=pl.LpBinary)
           for p in players for i in innings}

    # total_sits[player_id] = total number of innings a player sits throughout the entire game
    total_sits = {p["id"]: pl.LpVariable(f"total_sits_{p['id']}", cat=pl.LpInteger, lowBound=0, upBound=num_innings)
                  for p in players}
    
    # cumulative_sits[player_id, inning] = running count of how many times a player has sat by the end of inning i
    # This helps track sit patterns as the game progresses
    cumulative_sits = {(p["id"], i): pl.LpVariable(f"cum_sits_{p['id']}_{i}", cat=pl.LpInteger, lowBound=0, upBound=i)
                      for p in players for i in innings}

    #----- OBJECTIVE FUNCTION -----#
    # Goal: Maximize player-position fit based on skill levels, player preferences, and position importance
    
    obj_terms = []
    for p in players:
        player_id = p["id"]
        skill = p.get("skill")  # Player's skill level (higher is better)

        for i in innings:
            for pos in positions:
                coef = 0  # Initialize coefficient (weight) for this player-position-inning combination
                pos_importance = position_importance.get(pos, 1)  # How important this position is (default=1)

                # Get player's preference for this position
                positions_data = p.get("positions", {})
                preference = positions_data.get(pos).get("label").lower()

                # Calculate coefficient based on preference level:
                if preference == "wants to play":
                    coef = 100 * .3 + (((skill * 20) * (pos_importance)/100) * .7)  # Strong preference - heavily reward
                elif preference == "can play":
                    coef = 50 * .3 + (((skill * 20) * (pos_importance)/100) * .7)  # Moderate preference - moderately reward
                elif preference == "cannot play":
                    coef = -1000  # Strong negative - heavily penalize (will also be enforced by constraint)

                # print(p["player_name"])
                # print(pos)
                # print(coef)
                # Add term to objective function with appropriate weight
                obj_terms.append(coef * playerPosition[(player_id, i, pos)])

    # Set the objective function - maximize sum of all weighted player-position assignments
    prob += pl.lpSum(obj_terms), "Maximize_Player_Position_Fit"

    #----- CONSTRAINTS -----#

    # CONSTRAINT 1: Each player must be either playing exactly one position or sitting in each inning
    # Ensures every player is accounted for in every inning
    for p in players:
        for i in innings:
            prob += (pl.lpSum(playerPosition[(p["id"], i, pos)] for pos in positions) + sit[(p["id"], i)] == 1,
                    f"One_Position_Or_Sit_{p['id']}_{i}")

    # CONSTRAINT 2: Each position must be filled by exactly one player in each inning
    # Ensures all positions are covered in every inning
    for i in innings:
        for pos in positions:
            prob += (pl.lpSum(playerPosition[(p["id"], i, pos)] for p in players) == 1,
                    f"Position_Filled_{pos}_{i}")

    # CONSTRAINT 3: Track total sits for each player across all innings
    # Sets the total_sits variable correctly for each player
    for p in players:
        prob += (total_sits[p["id"]] == pl.lpSum(sit[(p["id"], i)] for i in innings),
                f"Count_Total_Sits_{p['id']}")

    # CONSTRAINT 4: Maximum difference of 1 sit between any two players (fairness)
    # Ensures balanced play time by limiting the maximum disparity in sits
    max_sit_diff = 1  # Maximum allowed difference in total sits between any two players
    for p1 in players:
        for p2 in players:
            if p1["id"] != p2["id"]:
                prob += (total_sits[p1["id"]] - total_sits[p2["id"]] <= max_sit_diff,
                        f"Fair_Sits_{p1['id']}_{p2['id']}")

    # CONSTRAINT 5: Players cannot sit in consecutive innings
    # Prevents players from being benched multiple innings in a row
    for p in players:
        for i in range(1, num_innings):
            prob += (sit[(p["id"], i)] + sit[(p["id"], i + 1)] <= 1,
                    f"No_Consecutive_Sits_{p['id']}_{i}")

    # CONSTRAINT 6: Exactly 10 players on field each inning (others sit)
    # Ensures proper team size on field (standard for slowpitch softball)
    for i in innings:
        prob += (pl.lpSum(sit[(p["id"], i)] for p in players) == num_players - 10,
                f"Ten_Players_On_Field_{i}")

    # CONSTRAINT 7: Track cumulative sits for each player at each inning
    # Sets up cumulative_sits variables to track running totals of sits
    for p in players:
        # First inning cumulative sits equals whether they sit in inning 1
        prob += (cumulative_sits[(p["id"], 1)] == sit[(p["id"], 1)], 
                f"Cumulative_Sits_Init_{p['id']}")
        
        # For subsequent innings, cumulative sits = previous cumulative + current sit
        for i in range(2, num_innings + 1):
            prob += (cumulative_sits[(p["id"], i)] == cumulative_sits[(p["id"], i-1)] + sit[(p["id"], i)],
                    f"Cumulative_Sits_Update_{p['id']}_{i}")

    # CONSTRAINT 8: Progressive fairness constraints using sit threshold indicators
    # Creates indicators for enforcing fair distribution of sits
    
    # Binary variables for different sit thresholds: 
    # v1[p, i] = 1 if player p has sat at least once by inning i
    # v2[p, i] = 1 if player p has sat at least twice by inning i
    # v3[p, i] = 1 if player p has sat at least three times by inning i
    v1 = pl.LpVariable.dicts("SatOnce", ((p["id"], i) for p in players for i in innings), cat='Binary')
    v2 = pl.LpVariable.dicts("SatTwice", ((p["id"], i) for p in players for i in innings), cat='Binary')
    v3 = pl.LpVariable.dicts("SatThree", ((p["id"], i) for p in players for i in innings), cat='Binary')

    M = num_innings  # Big-M value used for logical implications

    # Link v1, v2, and v3 indicator variables to cumulative sit counts
    for p in players:
        pid = p["id"]
        for i in innings:
            # v1 = 1 if and only if cumulative_sits ≥ 1
            prob += v1[(pid, i)] <= cumulative_sits[(pid, i)]  # If v1=1 then cum_sits >= 1
            prob += cumulative_sits[(pid, i)] <= M * v1[(pid, i)]  # If cum_sits >= 1 then v1=1

            # v2 = 1 if and only if cumulative_sits ≥ 2
            prob += 2 * v2[(pid, i)] <= cumulative_sits[(pid, i)]  # If v2=1 then cum_sits >= 2
            prob += cumulative_sits[(pid, i)] - 1 <= M * v2[(pid, i)]  # If cum_sits >= 2 then v2=1

            # v3 = 1 if and only if cumulative_sits ≥ 3 
            prob += 3 * v3[(pid, i)] <= cumulative_sits[(pid, i)]  # If v3=1 then cum_sits >= 3
            prob += cumulative_sits[(pid, i)] - 2 <= M * v3[(pid, i)]  # If cum_sits >= 3 then v3=1

    # Enforce progressive fairness in sits:
    # Rule 1: No player can sit twice until everyone has sat at least once
    # Rule 2: No player can sit three times until everyone has sat at least twice
    for i in innings:
        for p1 in players:
            for p2 in players:
                if p1["id"] != p2["id"]:
                    # If p1 has sat twice, then p2 must have sat at least once
                    prob += v1[(p2["id"], i)] >= v2[(p1["id"], i)], f"FairSit_{p1['id']}_{p2['id']}_Inning_{i}"
                    # If p1 has sat three times, then p2 must have sat at least twice
                    prob += v2[(p2["id"], i)] >= v3[(p1["id"], i)], f"FairSit3_{p1['id']}_{p2['id']}_Inning_{i}"

    # CO-ED RULE: Handle women players if present (conditional constraint)
    # Ensures gender diversity on the field if enough women players are available
    women_count = sum(1 for p in players if p.get("gender") == "F")
    if women_count >= 2:  # Only apply rule if we have at least 2 women
        for i in innings:
            # Count women playing non-catcher positions (catcher excluded for this rule)
            women_not_catching = pl.lpSum(playerPosition[(p["id"], i, pos)]
                                        for p in players
                                        for pos in positions
                                        if p.get("gender") == "F" and pos != "C")
            # Require at least 2 women in non-catcher positions
            prob += (women_not_catching >= 2,
                    f"Two_Women_Not_Catching_{i}")
    # If fewer than 2 women, skip this constraint

    # CONSTRAINT 9: Respect player position restrictions ("Cannot Play")
    # Prevents players from being assigned to positions they cannot play
    for p in players:
        for i in innings:
            for pos in positions:
                positions_data = p.get("positions", {})
                preference = positions_data.get(pos)

                # Handle different data formats for preferences
                if isinstance(preference, dict):  # If it's a dict, get the label
                    preference = preference.get("label", "Cannot Play")

                # If preference is "Cannot Play", enforce that player cannot be assigned to this position
                if preference and isinstance(preference, str) and preference.lower() == "cannot play":
                    prob += (playerPosition[(p["id"], i, pos)] == 0,
                            f"Cannot_Play_{p['id']}_{i}_{pos}")

    #----- SOLVE THE MODEL -----#
    
    # Solve the linear programming problem with error handling
    try:
        prob.solve(pl.PULP_CBC_CMD(msg=False, options=["maxSeconds=10"]))  # Use CBC solver without verbose output
    except Exception as e:
        err_msg = f"Error during optimization: {str(e)}"
        app.logger.error(err_msg)
        return {"success": False, "message": err_msg}

    # Check if a valid solution was found
    if prob.status != pl.LpStatusOptimal:
        status_msg = pl.LpStatus[prob.status]
        err_msg = f"No optimal solution found. Status: {status_msg}"
        app.logger.warning(err_msg)
        return {
            "success": False, 
            "message": err_msg
        }

    #----- EXTRACT AND FORMAT RESULTS -----#
    
    # Create schedule from solution
    schedule = {}
    for i in innings:
        schedule[i] = {
            "field": [],  # Players on field this inning
            "bench": []   # Players sitting this inning
        }

        for p in players:
            player_id = p["id"]
            # Record players on field with their assigned positions
            for pos in positions:
                if pl.value(playerPosition[(player_id, i, pos)]) > 0.5:  # Using 0.5 threshold for binary variables
                    schedule[i]["field"].append({
                        "id": player_id,
                        "name": p["player_name"],
                        "position": pos
                    })
            # Record players on bench
            if pl.value(sit[(player_id, i)]) > 0.5:
                schedule[i]["bench"].append({
                    "id": player_id,
                    "name": p["player_name"]
                })

    # Count total sits per player for reporting
    player_sits = {p["player_name"]: sum(pl.value(sit[(p["id"], i)]) for i in innings) for p in players}

    # Provide detailed info about sitting pattern (which innings each player sits)
    sit_pattern = {}
    for p in players:
        sit_pattern[p["player_name"]] = [i for i in innings if pl.value(sit[(p["id"], i)]) > 0.5]

    # Return full results
    return {
        "success": True,
        "schedule": schedule,          # Complete inning-by-inning assignments
        "objective_value": float(pl.value(prob.objective)),  # Quality score of solution
        "player_sits": player_sits,    # Total sits per player
        "sit_pattern": sit_pattern     # Which innings each player sits out
    }

auth_users = [
    'daniel.r.duclos@gmail.com',
    'greg.duclos@gmail.com'
]

def get_authenticated_user(flask_request):
    # Convert Flask request to httpx.Request
    req = httpx.Request(
        method=request.method,
        url=request.url,
        headers=request.headers
    )
    return clerk_sdk.authenticate_request(
        req,
        AuthenticateRequestOptions(
            authorized_parties=["http://localhost:5173"]  # Your frontend origin
        )
    )

@app.route('/')
def index():
    return """
    <h1>Yo</h1>
    """

# Add a user
@app.route("/api/users", methods=["POST"])
def login():
    result = get_authenticated_user(request)

    if not result.is_signed_in:
        return jsonify({"error": "unauthorized"}), 401
    
    user_id = result.payload.get("sub")
    email = result.payload.get("email")
    full_name = result.payload.get("name")
    
    try:
        session.clear()
        result = db.Users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "full_name": full_name,
                    "email": email
                }},
            upsert=True
        )
        
        session["user_id"] = user_id
        session["guest_mode"] = email not in auth_users

        if email not in auth_users:
                return jsonify("User is in guest mode"), 200
        
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        app.logger.info(e)
        return jsonify({"error": str(e)}), 500

# Get all teams for a user
@app.route("/api/teams/user/", methods=["GET"])
def getTeams():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No user id"}), 400
    try:
        teams = list(db.Teams.find({"user_id": user_id}))
        for team in teams:
            # mongodb stores _id as ObjectID
            team["_id"] = str(team["_id"])
        return jsonify(teams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get one team by team_id
@app.route("/api/teams/<team_id>", methods=["GET"])
def get_team_by_id(team_id):
    if not team_id:
        return jsonify({"error": "No team id"}), 400
    try:
        team = db.Teams.find_one({"team_id": team_id})
        if not team:
            return jsonify({"error": "Team not found"}), 404
        team["_id"] = str(team["_id"])  # Make _id JSON serializable
        return jsonify(team), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a team
@app.route("/api/teams", methods=["POST"])
def addTeam():
    user_id = session.get("user_id")
    data = request.json
    data["user_id"] = user_id
    if not user_id:
        return jsonify({"error": "No user id"}), 400
    try:
        result = db.Teams.update_one(
            {
                "user_id": data["user_id"],
                "team_name": data["team_name"],
                "season": data["season"],
                "division": data["division"]
            },
            {
                "$set": data,
                "$setOnInsert": {"team_id": str(ObjectId())}
            },
            upsert=True
        )
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#  Add a player to a team
@app.route("/api/teams/<team_id>/players", methods=["POST"])
def addPlayer(team_id):
    data = request.json
    data["team_id"] = team_id # add team_id to the player object
    try:
        result = db.Players.update_one(
            {
                "player_name": data["player_name"],
                "skill": data["skill"],
                "positions": data["positions"],
                "team_id": team_id,
                "gender": data["gender"]
            },
            {
                "$set": data,
                "$setOnInsert": {"player_id": str(ObjectId())}
            },
            upsert=True
        )
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update a player for a team
@app.route("/api/teams/<team_id>/players/update", methods=["POST"])
def updatePlayer(team_id):
    data = request.json
    try:
        result = db.Players.update_one(
            {
                "player_id": data["player_id"], "team_id": team_id
            },
            {
                "$set": { 
                        "player_name": data["player_name"],
                        "skill": data["skill"],
                        "positions": data["positions"],
                        "team_id": team_id,
                        "gender": data["gender"],
                        "player_id": data["player_id"] 
                        }
            }
        )
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all players for a team
@app.route("/api/teams/<team_id>/players", methods=["GET"])
def getPlayers(team_id):
    try:
        players = list(db.Players.find({"team_id": team_id}))
        for player in players:
            player["_id"] = str(player["_id"])
        return jsonify(players), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Set importance for a team
@app.route("/api/teams/<team_id>/importance", methods=["POST"])
def setImportance(team_id):
    data = request.json
    data["team_id"] = team_id
    try:
        result = db.Position_Importance.update_one(
            {"team_id": team_id},
            {"$set": data},
            upsert=True
        )
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get importance for a team
@app.route("/api/teams/<team_id>/importance", methods=["GET"])
def getImportance(team_id):
    try:
        result = db.Position_Importance.find_one({"team_id": team_id})
        if result:
            result["_id"] = str(result["_id"])
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/teams/<team_id>/lineup", methods=["POST"])
def optimize(team_id):
    data = request.json
    try:
        result = optimize_softball_lineup(data)
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Optimization failed",
            "details": str(e)
        }), 500

@app.route('/api/teams/<id>/<type>', methods=['DELETE'])
def delete(id, type):
    try:
        if type == "Player":
            result = db.Players.delete_one(
                {"player_id": id}
            )
        elif type == "Team":
            result = db.Teams.delete_one(
                {"team_id": id}
            )
        return jsonify("Player Deleted"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ping')
def ping():
    return 'pong'

@app.route('/api/me', methods=['GET'])
def me():
    app.logger.debug(f"Session contents: {dict(session)}")
    user_id = session.get("user_id")
    guest = session.get("guest_mode")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 4014

    return f"<h1>{user_id}</h1><br/><h1>{guest}</h1>"

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)