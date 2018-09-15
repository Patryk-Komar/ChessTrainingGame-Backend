// Creating express router

import express from "express";

const gameRouter = express.Router();


// Importing MySQL database configuration files

import connection from "../database/connection";
import databaseConfig from "../config/database";


// Main game API endpoint

gameRouter.get("/", (request, response) => {
    response.send("Game API works!");
});


// Get random puzzle of specified type for a ranked game

gameRouter.post("/ranked/puzzles/get", (request, response) => {
    const {
        gameMode,
        username
    } = request.body;

    const {
        requestTimeout
    } = databaseConfig;

    const gameModeName = `${gameMode.split(/(?=[A-Z])/).join().toLowerCase().replace(/,/g, "-")}s`;

    const scoresTable = `\`${gameModeName}-scores\``;
    const puzzlesTable = `\`${gameModeName}\``;

    connection.query({
        sql: `SELECT * FROM ${scoresTable} WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else if (results.length !== 1) {
            response.status(200);
            response.send({
                message: "Ranked game session is available only for authorized players. Please sign in and try again.",
                success: false
            });
        } else {
            const uncompletedLevels = [];
            const user = results[0];
            for (const propertyName in user) {
                if (user[propertyName] === null) {
                    const levelNumber = parseInt(propertyName.replace("puzzle", ""), 10);
                    uncompletedLevels.push(levelNumber);
                }
            }
            if (uncompletedLevels.length === 0) {
                response.status(200);
                response.send({
                    message: "You have already completed all puzzles in this category. Please select another one or play non-ranked game.",
                    success: false
                });
            } else {
                const random = Math.floor(Math.random() * uncompletedLevels.length);
                const levelNumber = uncompletedLevels[random];
                connection.query({
                    sql: `SELECT * FROM ${puzzlesTable} WHERE id = ?`,
                    timeout: requestTimeout,
                    values: [
                        levelNumber
                    ]
                }, (error, results) => {
                    if (error) {
                        response.status(200);
                        response.send({
                            error: "Internal Server Error",
                            success: false
                        });
                    } else if (results.length !== 1) {
                        response.status(200);
                        response.send({
                            success: false
                        });
                    } else {
                        response.status(200);
                        response.send({
                            result: results[0],
                            success: true
                        });
                    }
                });
            }
        }
    });
});


// Update player's score of a specific puzzle

gameRouter.put("/ranked/puzzles/update", (request, response) => {
    const {
        gameMode,
        puzzleID,
        time,
        mistakes,
        username
    } = request.body;

    const {
        requestTimeout
    } = databaseConfig;

    const scoresTable = `\`${gameMode.split(/(?=[A-Z])/).join().toLowerCase().replace(/,/g, "-")}s-scores\``;

    connection.query({
        sql: `SELECT * FROM ${scoresTable} WHERE username = ? AND puzzle${puzzleID} IS NULL`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else if (results.length !== 1) {
            response.status(200);
            response.send({
                success: false
            });
        } else {
            const timeResult = ((time / 1000) + mistakes * 2).toFixed(2);
            connection.query({
                sql: `UPDATE ${scoresTable} SET puzzle${puzzleID} = ? WHERE username = ?`,
                timeout: requestTimeout,
                values: [
                    timeResult,
                    username
                ]
            }, (error) => {
                if (error) {
                    response.status(200);
                    response.send({
                        error: "Internal Server Error",
                        success: false
                    });
                } else {
                    response.status(200);
                    response.send({
                        success: true
                    });
                }
            });
        }
    });
});


// Get random puzzle for a non-ranked game (training)

gameRouter.post("/non-ranked/puzzles", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;
    const availableGameModes = {
        names: [
            // "oneMoveCheckmate",
            // "twoMovesCheckmate",
            "threeMovesCheckmate",
            // "stalemate",
            // "doubleAttack"
        ],
        tables: [
            // "one-move-checkmates",
            // "two-moves-checkmates",
            "three-moves-checkmates",
            // "stalemates",
            // "double-attacks"
        ]
    };
    const random = Math.floor(Math.random() * availableGameModes.tables.length);
    const gameModeName = availableGameModes.names[random];
    const tableName = availableGameModes.tables[random];
    const puzzlesTable = `\`${tableName}\``;

    connection.query({
        sql: `SELECT * FROM ${puzzlesTable}`,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            const puzzleRandom = Math.floor(Math.random() * results.length);
            const puzzle = results[puzzleRandom];
            response.status(200);
            response.send({
                gameModeName: gameModeName,
                result: puzzle,
                success: true
            });
        }
    });
});


export default gameRouter;
