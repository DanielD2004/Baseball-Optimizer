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
CORS(app, origins="http://localhost:5173")
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

    Args:
        team_data (dict): Dictionary containing player and position data

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

    prob = pl.LpProblem("Softball_Lineup_Optimization", pl.LpMaximize)

    x = {(p["id"], i, pos): pl.LpVariable(f"x_{p['id']}_{i}_{pos}", cat=pl.LpBinary)
         for p in players for i in innings for pos in positions}

    sit = {(p["id"], i): pl.LpVariable(f"sit_{p['id']}_{i}", cat=pl.LpBinary)
           for p in players for i in innings}

    total_sits = {p["id"]: pl.LpVariable(f"total_sits_{p['id']}", cat=pl.LpInteger, lowBound=0, upBound=num_innings)
                  for p in players}

    obj_terms = []

    for p in players:
        player_id = p["id"]
        skill = p.get("skill", 0)

        for i in innings:
            for pos in positions:
                coef = 0  # Initialize coef to 0
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

                if preference_lower == "wants to play":
                    coef = 5 * skill + 5 * pos_importance  # strongly reward
                elif preference_lower == "can play":
                    coef = 3 * skill + 3 * pos_importance  # medium reward
                elif preference_lower == "cannot play":
                    coef = -1000  # heavy penalty (also constrained below)

                # Add term only if coef is not negative
                obj_terms.append(coef * x[(player_id, i, pos)])

    prob += pl.lpSum(obj_terms)

    for p in players:
        for i in innings:
            prob += pl.lpSum(x[(p["id"], i, pos)] for pos in positions) + sit[(p["id"], i)] == 1

    for i in innings:
        for pos in positions:
            prob += pl.lpSum(x[(p["id"], i, pos)] for p in players) == 1

    for p in players:
        prob += total_sits[p["id"]] == pl.lpSum(sit[(p["id"], i)] for i in innings)

    max_sit_diff = 1
    for p1 in players:
        for p2 in players:
            if p1["id"] != p2["id"]:
                prob += total_sits[p1["id"]] - total_sits[p2["id"]] <= max_sit_diff

    for p in players:
        for i in range(1, num_innings):
            prob += sit[(p["id"], i)] + sit[(p["id"], i + 1)] <= 1

    num_players = len(players)
    for i in innings:
        prob += pl.lpSum(sit[(p["id"], i)] for p in players) == num_players - 10

    # Co-ed rule: at least 2 women not catching
    for i in innings:
        women_not_catching = pl.lpSum(x[(p["id"], i, pos)]
                                      for p in players
                                      for pos in positions
                                      if p.get("gender") == "F" and pos != "C")
        prob += women_not_catching >= 2

    # Respect player position preferences
    for p in players:
        for i in innings:
            for pos in positions:
                positions_data = p.get("positions", {})
                preference = positions_data.get(pos)

                if isinstance(preference, dict):  # If it's a dict, get the label
                    preference = preference.get("label", "Cannot Play")

                if preference and isinstance(preference, str) and preference.lower() == "cannot play":
                    prob += x[(p["id"], i, pos)] == 0

    try:
        prob.solve(pl.PULP_CBC_CMD(msg=False))
    except Exception as e:
        err_msg = f"Error during optimization: {str(e)}"
        app.logger.error(err_msg)
        return {"success": False, "message": err_msg}

    if prob.status != pl.LpStatusOptimal:
        status_msg = pl.LpStatus[prob.status]
        err_msg = f"No optimal solution found. Status: {status_msg}"
        app.logger.warning(err_msg)
        return {
            "success": False,
            "message": err_msg
        }

    schedule = {}
    for i in innings:
        schedule[i] = {
            "field": [],
            "bench": []
        }

        for p in players:
            player_id = p["id"]
            for pos in positions:
                if pl.value(x[(player_id, i, pos)]) > 0.5:
                    schedule[i]["field"].append({
                        "id": player_id,
                        "name": p["player_name"],
                        "position": pos,
                        "skill": p.get("skill", 0),
                        "gender": p.get("gender", "")
                    })

            if pl.value(sit[(player_id, i)]) > 0.5:
                schedule[i]["bench"].append({
                    "id": player_id,
                    "name": p["player_name"]
                })

    player_sits = {p["player_name"]: sum(pl.value(sit[(p["id"], i)]) for i in innings) for p in players}

    return {
        "success": True,
        "schedule": schedule,
        "objective_value": float(pl.value(prob.objective)),
        "player_sits": player_sits
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