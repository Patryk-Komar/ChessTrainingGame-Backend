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


// Check if puzzle type is already unlocked

gameRouter.post("/puzzles/unlocked", (request, response) => {
    const {
        username,
        gameMode
    } = request.body;
    if (gameMode === "oneMoveCheckmate" || gameMode === "stalemate" || gameMode === "doubleAttack") {
        response.status(200);
        response.send({
            success: true
        });
    } else {
        const {
            requestTimeout
        } = databaseConfig;
        if (gameMode === "twoMovesCheckmate") {
            const oneMoveCheckmatesScores = "\`one-move-checkmates-scores\`";
            connection.query({
                sql: `SELECT * FROM ${oneMoveCheckmatesScores} WHERE username = ?`,
                timeout: requestTimeout,
                values: [
                    username
                ]
            }, (error, results) => {
                if (error || results.length !== 1) {
                    response.status(200);
                    response.send({
                        success: false
                    });
                } else {
                    const [
                        userScores
                    ] = results;
                    let completedLevelsCounter = 0;
                    for (const score in userScores) {
                        if (score !== "username" && userScores[score] !== null) {
                            completedLevelsCounter++;
                        }
                    }
                    if (completedLevelsCounter >= 100) {
                        response.status(200);
                        response.send({
                            success: true
                        });
                    } else {
                        response.status(200);
                        response.send({
                            success: false
                        });
                    }
                }
            });
        } else if (gameMode === "threeMovesCheckmate") {
            const twoMovesCheckmatesScores = "\`two-moves-checkmates-scores\`";
            connection.query({
                sql: `SELECT * FROM ${twoMovesCheckmatesScores} WHERE username = ?`,
                timeout: requestTimeout,
                values: [
                    username
                ]
            }, (error, results) => {
                if (error || results.length !== 1) {
                    response.status(200);
                    response.send({
                        success: false
                    });
                } else {
                    const [
                        userScores
                    ] = results;
                    let completedLevelsCounter = 0;
                    for (const score in userScores) {
                        if (score !== "username" && userScores[score] !== null) {
                            completedLevelsCounter++;
                        }
                    }
                    if (completedLevelsCounter >= 50) {
                        response.status(200);
                        response.send({
                            success: true
                        });
                    } else {
                        response.status(200);
                        response.send({
                            success: false
                        });
                    }
                }
            });
        } else {
            response.status(200);
            response.send({
                success: false
            });
        }
    }
});


// Check if there is at least one uncompleted puzzle of specific type

gameRouter.post("/puzzles/ranked/completed", (request, response) => {
    const {
        username,
        gameMode
    } = request.body;

    const {
        requestTimeout
    } = databaseConfig;

    const scoresTable = `\`${gameMode.split(/(?=[A-Z])/).join().toLowerCase().replace(/,/g, "-")}s-scores\``;

    connection.query({
        sql: `SELECT * FROM ${scoresTable} WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error || results.length !== 1) {
            response.send({
                success: false
            });
        } else {
            const [
                userScores
            ] = results;
            let uncompleted = false;
            for (const score in userScores) {
                if (score !== "username" && userScores[score] === null) {
                    uncompleted = true;
                    break;
                }
            }
            if (uncompleted) {
                response.send({
                    success: true
                });
            } else {
                response.send({
                    success: false
                });
            }
        }
    });
});


// Get random puzzle of specified type for a ranked game

gameRouter.post("/puzzles/ranked/get", (request, response) => {
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

gameRouter.put("/puzzles/ranked/update", (request, response) => {
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


// Get puzzle for a non-ranked game (training)

gameRouter.post("/puzzles/non-ranked/get", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;

    const {
        random
    } = request.body;

    if (random) {
        const availableGameModes = {
            names: [
                "oneMoveCheckmate",
                "twoMovesCheckmate",
                "threeMovesCheckmate",
                "stalemate",
                "doubleAttack"
            ],
            tables: [
                "\`one-move-checkmates\`",
                "\`two-moves-checkmates\`",
                "\`three-moves-checkmates\`",
                "\`stalemates\`",
                "\`double-attacks\`"
            ]
        };
        const tableRandom = Math.floor(Math.random() * availableGameModes.tables.length);
        const gameModeName = availableGameModes.names[tableRandom];
        const puzzlesTable = availableGameModes.tables[tableRandom];

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
    } else {
        const {
            gameMode
        } = request.body;
        const puzzlesTable = `\`${gameMode.split(/(?=[A-Z])/).join().toLowerCase().replace(/,/g, "-")}s\``;

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
                    gameModeName: gameMode,
                    result: puzzle,
                    success: true
                });
            }
        });
    }
});


export default gameRouter;
