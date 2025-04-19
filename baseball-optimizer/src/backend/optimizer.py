import json
import os
import pulp as pl
from flask_cors import CORS
from tabulate import tabulate
from flask import Flask, request, jsonify
import logging
import time
from pymongo import MongoClient
from bson import ObjectId
from dotenv import dotenv_values
from pymongo.server_api import ServerApi
import os
import requests

config = dotenv_values(".env")
app = Flask(__name__)
CORS(app)
uri = config.get("MONGO_URI")
client = MongoClient(uri, server_api=ServerApi('1'))
db = client["Optimizer"]

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
# Enable detailed logging for debugging
# logging.basicConfig(level=logging.DEBUG)

def optimize_softball_lineup(team_data):
    """
    Optimize defensive lineup for a slowpitch softball team using linear programming.
    Creates fair schedule ensuring balanced play time and respecting position preferences.

    Args:
        team_data (dict): Dictionary containing player data, position preferences, and position importance

    Returns:
        dict: Optimized schedule and objective value if found, or error message
    """
    app.logger.debug(f"Team data received: {team_data}")
    
    # Extract players and position importance
    try:
        players = team_data.get("players", [])
        position_importance = team_data.get("importance", {})
    except (KeyError, AttributeError) as e:
        err_msg = f"Invalid team data format: {str(e)}"
        app.logger.error(err_msg)
        return {"success": False, "message": err_msg}

    if not players:
        return {"success": False, "message": "No players found in team data"}

    # Add IDs to players and normalize gender values
    for i, player in enumerate(players):
        player["id"] = f"p{i+1}"
        
        # Handle gender formats: "Male"/"Female" → "M"/"F"
        if "gender" in player:
            if player["gender"] == "Female":
                player["gender"] = "F"
            elif player["gender"] == "Male":
                player["gender"] = "M"
        else:
            # Default fallback (though shouldn't be needed with your data)
            player["gender"] = "M"

    positions = ["P", "C", "1B", "2B", "3B", "SS", "LF", "LC", "RC", "RF"]
    innings = list(range(1, 10))
    num_innings = len(innings)
    num_players = len(players)

    # Create the linear programming problem (maximize objective)
    prob = pl.LpProblem("Softball_Lineup_Optimization", pl.LpMaximize)

    # DECISION VARIABLES
    # x[player_id, inning, position] = 1 if player plays position in inning, 0 otherwise
    x = {(p["id"], i, pos): pl.LpVariable(f"x_{p['id']}_{i}_{pos}", cat=pl.LpBinary)
         for p in players for i in innings for pos in positions}

    # sit[player_id, inning] = 1 if player sits in inning, 0 otherwise
    sit = {(p["id"], i): pl.LpVariable(f"sit_{p['id']}_{i}", cat=pl.LpBinary)
           for p in players for i in innings}

    # total_sits[player_id] = total number of innings player sits
    total_sits = {p["id"]: pl.LpVariable(f"total_sits_{p['id']}", cat=pl.LpInteger, lowBound=0, upBound=num_innings)
                  for p in players}
    
    # cumulative_sits[player_id, inning] = number of times player has sat by end of inning i
    cumulative_sits = {(p["id"], i): pl.LpVariable(f"cum_sits_{p['id']}_{i}", cat=pl.LpInteger, lowBound=0, upBound=i)
                      for p in players for i in innings}
                      
    # v[player_id, inning] = 1 if player has sat at least twice by the end of inning i
    v = {(p["id"], i): pl.LpVariable(f"v_{p['id']}_{i}", cat=pl.LpBinary)
        for p in players for i in innings}

    # OBJECTIVE FUNCTION: Maximize skill-position fit and player preferences
    obj_terms = []
    for p in players:
        player_id = p["id"]
        skill = p.get("skill", 0)

        for i in innings:
            for pos in positions:
                coef = 0  # Initialize coefficient to 0
                pos_importance = position_importance.get(pos, 1)

                positions_data = p.get("positions", {})
                preference = positions_data.get(pos) if isinstance(positions_data, dict) else "Cannot Play"

                # Handle different preference types
                if isinstance(preference, dict):
                    preference_label = preference.get("label", "Cannot Play")  # Get label if it's a dict
                else:
                    preference_label = preference  # Otherwise, use the value directly

                # Ensure preference_label is a string before calling lower()
                if isinstance(preference_label, str):
                    preference_lower = preference_label.lower()
                else:
                    preference_lower = "cannot play"  # Default if it's not a string

                # Assign coefficient based on player preferences
                if preference_lower == "wants to play":
                    coef = 5 * skill + 5 * pos_importance  # strongly reward
                elif preference_lower == "can play":
                    coef = 3 * skill + 3 * pos_importance  # medium reward
                elif preference_lower == "cannot play":
                    coef = -1000  # heavy penalty (also constrained below)

                # Add term to objective function
                obj_terms.append(coef * x[(player_id, i, pos)])

    # Set the objective function
    prob += pl.lpSum(obj_terms), "Maximize_Player_Position_Fit"

    # CONSTRAINT 1: Each player must be either playing a position or sitting in each inning
    for p in players:
        for i in innings:
            prob += (pl.lpSum(x[(p["id"], i, pos)] for pos in positions) + sit[(p["id"], i)] == 1,
                    f"One_Position_Or_Sit_{p['id']}_{i}")

    # CONSTRAINT 2: Each position must be filled by exactly one player in each inning
    for i in innings:
        for pos in positions:
            prob += (pl.lpSum(x[(p["id"], i, pos)] for p in players) == 1,
                    f"Position_Filled_{pos}_{i}")

    # CONSTRAINT 3: Track total sits for each player across all innings
    for p in players:
        prob += (total_sits[p["id"]] == pl.lpSum(sit[(p["id"], i)] for i in innings),
                f"Count_Total_Sits_{p['id']}")

    # CONSTRAINT 4: Maximum difference of 1 sit between any two players (fairness)
    max_sit_diff = 1
    for p1 in players:
        for p2 in players:
            if p1["id"] != p2["id"]:
                prob += (total_sits[p1["id"]] - total_sits[p2["id"]] <= max_sit_diff,
                        f"Fair_Sits_{p1['id']}_{p2['id']}")

    # CONSTRAINT 5: Players cannot sit in consecutive innings
    for p in players:
        for i in range(1, num_innings):
            prob += (sit[(p["id"], i)] + sit[(p["id"], i + 1)] <= 1,
                    f"No_Consecutive_Sits_{p['id']}_{i}")

    # CONSTRAINT 6: Exactly 10 players on field each inning (others sit)
    for i in innings:
        prob += (pl.lpSum(sit[(p["id"], i)] for p in players) == num_players - 10,
                f"Ten_Players_On_Field_{i}")

    # CONSTRAINT 7: Track cumulative sits for each player at each inning
    for p in players:
        # First inning cumulative sits equals if they sit in inning 1
        prob += (cumulative_sits[(p["id"], 1)] == sit[(p["id"], 1)], 
                f"Cumulative_Sits_Init_{p['id']}")
        
        # For subsequent innings, cumulative sits = previous cumulative + current sit
        for i in range(2, num_innings + 1):
            prob += (cumulative_sits[(p["id"], i)] == cumulative_sits[(p["id"], i-1)] + sit[(p["id"], i)],
                    f"Cumulative_Sits_Update_{p['id']}_{i}")

    # CONSTRAINT 8: Track when a player has sat at least twice by each inning
    for p in players:
        for i in innings:
            # v[p, i] = 1 if cumulative_sits[p, i] >= 2, else 0
            # If v is 1, then cumulative sits must be at least 2
            prob += (2 * v[(p["id"], i)] <= cumulative_sits[(p["id"], i)],
                    f"Track_AtLeastTwoSits_Min_{p['id']}_{i}")
            
            # If cumulative sits are at least 2, then v must be 1
            # Using Big-M: cumulative_sits <= 1 + M*v where M is a large number
            M = num_innings  # Big-M value
            prob += (cumulative_sits[(p["id"], i)] - 1 <= M * v[(p["id"], i)],
                    f"Track_AtLeastTwoSits_Max_{p['id']}_{i}")

    # CONSTRAINT 9: Ensure fair rotation - no player can sit twice before everyone sits once
    for i in innings:
        for p1 in players:
            for p2 in players:
                if p1["id"] != p2["id"]:
                    # If p1 has sat at least twice by inning i, then p2 must have sat at least once by inning i
                    prob += (cumulative_sits[(p2["id"], i)] >= v[(p1["id"], i)],
                            f"Fair_Rotation_{p1['id']}_{p2['id']}_{i}")

    # CO-ED RULE: Handle women players if present (conditional constraint)
    women_count = sum(1 for p in players if p.get("gender") == "F")
    if women_count >= 2:
        for i in innings:
            women_not_catching = pl.lpSum(x[(p["id"], i, pos)]
                                        for p in players
                                        for pos in positions
                                        if p.get("gender") == "F" and pos != "C")
            prob += (women_not_catching >= 2,
                    f"Two_Women_Not_Catching_{i}")
    # If fewer than 2 women, skip this constraint

    # CONSTRAINT 10: Respect player position restrictions ("Cannot Play")
    for p in players:
        for i in innings:
            for pos in positions:
                positions_data = p.get("positions", {})
                preference = positions_data.get(pos)

                if isinstance(preference, dict):  # If it's a dict, get the label
                    preference = preference.get("label", "Cannot Play")

                if preference and isinstance(preference, str) and preference.lower() == "cannot play":
                    prob += (x[(p["id"], i, pos)] == 0,
                            f"Cannot_Play_{p['id']}_{i}_{pos}")

    # Solve the linear programming problem
    try:
        prob.solve(pl.PULP_CBC_CMD(msg=False))
    except Exception as e:
        err_msg = f"Error during optimization: {str(e)}"
        app.logger.error(err_msg)
        return {"success": False, "message": err_msg}

    # Check if solution is optimal
    if prob.status != pl.LpStatusOptimal:
        status_msg = pl.LpStatus[prob.status]
        err_msg = f"No optimal solution found. Status: {status_msg}"
        app.logger.warning(err_msg)
        return {
            "success": False,
            "message": err_msg
        }

    # Create schedule from solution
    schedule = {}
    for i in innings:
        schedule[i] = {
            "field": [],
            "bench": []
        }

        for p in players:
            player_id = p["id"]
            # Record players on field with their positions
            for pos in positions:
                if pl.value(x[(player_id, i, pos)]) > 0.5:
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

    # Provide detailed info about sitting pattern
    sit_pattern = {}
    for p in players:
        sit_pattern[p["player_name"]] = [i for i in innings if pl.value(sit[(p["id"], i)]) > 0.5]

    return {
        "success": True,
        "schedule": schedule,
        "objective_value": float(pl.value(prob.objective)),
        "player_sits": player_sits,
        "sit_pattern": sit_pattern  # Added to help verify sits are properly distributed
    }

@app.route('/')
def index():
    return """
    <h1>Yo</h1>
    """

# Get all teams for a user
@app.route("/api/teams/<user_id>", methods=["GET"])
def getTeams(user_id):
    get_teams_start_time = time.time()
    if not user_id:
        return jsonify({"error": "No user id"}), 400
    try:
        teams = list(db.Teams.find({"user_id": user_id}))
        for team in teams:
            # mongodb stores _id as ObjectID
            team["_id"] = str(team["_id"])
        get_teams_end_time = time.time()
        processing_time = get_teams_end_time - get_teams_start_time
        app.logger.debug(f"getTeams Processing Time: {processing_time:.4f} seconds")
        return jsonify(teams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# # Get all teams for a user
# @app.route("/api/teams/<user_id>", methods=["GET"])
# def getTeams(user_id):
#     if not user_id:
#         return jsonify({"error": "No user id"}), 400
#     try:
#         teams = list(db.Teams.find({"user_id": user_id}))
#         for team in teams:
#             # mongodb stores _id as ObjectID
#             team["_id"] = str(team["_id"])
#         return jsonify(teams), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# Add a user
@app.route("/api/users", methods=["POST"])
def addUser():
    data = request.json
    try:
        result = db.Users.update_one(
            {"user_id": data["user_id"],
             "full_name": data["full_name"],
             "email": data["email"]             
             },
            {
                "$set": data
            },
            upsert=True
        )
        return jsonify({"matched": result.matched_count, "modified": result.modified_count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a team
@app.route("/api/teams", methods=["POST"])
def addTeam():
    data = request.json
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
            {"team_id": team_id, "user_id": data["user_id"]},
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

@app.route('/ping')
def ping():
    return 'pong'

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)