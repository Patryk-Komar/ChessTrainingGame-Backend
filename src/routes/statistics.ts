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


// registered users number

statisticsRouter.get("/registeredUsers", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;
    connection.query({
        sql: `SELECT COUNT(*) FROM users`,
        timeout: requestTimeout
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
    const {
        requestTimeout
    } = databaseConfig;
    connection.query({
        sql: `SELECT online FROM users`,
        timeout: requestTimeout
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