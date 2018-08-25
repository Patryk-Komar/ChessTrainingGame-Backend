// Creating express router

import express from "express";

const statisticsRouter = express.Router();


// Connecting to MySQL database

import connection from "../database/connection";

connection.connect((error) => {
    if (error) {
        console.log(`MySQL connection error: ${error}`);
    }
});


// Main statistics API endpoint

statisticsRouter.get("/", (request, response) => {
    response.send("Statistics API works!");
});


// registered users number

statisticsRouter.get("/registeredUsers", (request, response) => {
    connection.query({
        sql: `SELECT COUNT(*) FROM users`,
        timeout: 5000
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            const countProperty = "COUNT(*)";
            response.send({
                code: 200,
                content: "Success",
                data: {
                    registered: results[0][countProperty]
                }
            });
        }
    });
});


// Online users number

statisticsRouter.get("/onlineUsers", (request, response) => {
    connection.query({
        sql: `SELECT online FROM users`,
        timeout: 5000
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            let onlineUsers = 0;
            const date = Date.now();
            for (const row of results) {
                if (date - row.online <= 300000) {
                    onlineUsers++;
                }
            }
            response.send({
                code: 200,
                content: "Success",
                data: {
                    online: onlineUsers
                }
            });
        }
    });
});


export default statisticsRouter;