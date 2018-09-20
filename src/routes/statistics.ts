// Creating express router

import express from "express";

const statisticsRouter = express.Router();


// Importing MySQL database configuration files

import connection from "../database/connection";
import databaseConfig from "../config/database";


// Main statistics API endpoint

statisticsRouter.get("/", (request, response) => {
    response.send("Statistics API works!");
});


// Registered users number

statisticsRouter.get("/registeredUsers", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;
    connection.query({
        sql: `SELECT COUNT(*) FROM users`,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            const countProperty = "COUNT(*)";
            const registeredUsers = results[0][countProperty];
            response.status(200);
            response.send({
                registeredUsers: registeredUsers,
                success: true
            });
        }
    });
});


// Online users number

statisticsRouter.get("/onlineUsers", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;
    connection.query({
        sql: `SELECT online FROM users`,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            let onlineUsers = 0;
            const date = Date.now();
            for (const row of results) {
                if (date - row.online <= 300000) {
                    onlineUsers++;
                }
            }
            response.status(200);
            response.send({
                onlineUsers: onlineUsers,
                success: true
            });
        }
    });
});


// Numbers displayed on promotion page

statisticsRouter.get("/presentation", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;
    const oneMoveCheckmatesTable = "\`one-move-checkmates\`";
    const twoMovesCheckmatesTable = "\`two-moves-checkmates\`";
    const threeMovesCheckmatesTable = "\`three-moves-checkmates\`";
    // const stalematesTable = "\`stalemates\`";
    // const doubleAttacksTable = "\`double-attacks\`";
    connection.query({
        sql: `SELECT
            (SELECT COUNT(*) FROM ${oneMoveCheckmatesTable}) AS count1,
            (SELECT COUNT(*) FROM ${twoMovesCheckmatesTable}) AS count2,
            (SELECT COUNT(*) FROM ${threeMovesCheckmatesTable}) AS count3
            FROM dual`,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: error,
                success: false
            });
        } else {
            const [
                puzzles
            ] = results;
            let chessPuzzles = 0;
            for (const property in puzzles) {
                chessPuzzles += puzzles[property];
            }
            response.status(200);
            response.send({
                // chessPuzzles: chessPuzzles,
                chessPuzzles: 500,
                strategyGuides: 20,
                thematicArticles: 100,
                forumThreads: 50,
                success: true
            });
        }
    });
});


export default statisticsRouter;
