const express = require("express");
const app = express();
app.use(express.json());
let db = null;
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
  app.listen(3000, () => {
    console.log("Server Started Successfully");
  });
};

initDBAndServer();

// API 1 - Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT player_id as playerId, player_name as playerName 
    FROM player_details;`;
  const players = await db.all(playersQuery);
  response.send(players);
});

// API 2 - Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT player_id as playerId, 
    player_name as playerName FROM 
    player_details WHERE player_id = ${playerId};
    `;
  const singlePlayer = await db.get(playerQuery);
  response.send(singlePlayer);
});

// API 3 - Updates the details of a specific player based on the player ID

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE player_details 
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId}; 
    `;
  await db.run(updateQuery);

  response.send("Player Details Updated");
});

// API 4 - Returns the match details of a specific match

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT match_id as matchId,match,year
    FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(matchDetails);
});

// API 5 - Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchListQuery = `
    SELECT match_details.match_id as matchId, match, year
    FROM player_match_score 
    INNER JOIN match_details
    ON match_details.match_id = player_match_score.match_id
    WHERE player_id = ${playerId};`;
  const matchList = await db.all(playerMatchListQuery);
  response.send(matchList);
});

// API 6 - Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchPlayerListQuery = `
  SELECT player_details.player_id as playerId, 
  player_name as playerName FROM player_match_score
  INNER JOIN player_details
  ON player_match_score.player_id = player_details.player_id
  WHERE match_id = ${matchId};`;
  const matchesList = await db.all(matchPlayerListQuery);
  response.send(matchesList);
});

// API 7 - Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalScoresQuery = `
    SELECT player_match_score.player_id as playerId, 
    player_name as playerName, 
    SUM(score) as totalScore, 
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM player_details INNER JOIN 
    player_match_score 
    ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const data = await db.get(totalScoresQuery);
  response.send(data);
});

module.exports = app;
