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
            response.status(500);
            response.send("Internal Server Error");
        } else {
            const countProperty = "COUNT(*)";
            const registeredUsers = results[0][countProperty];
            response.status(200);
            response.send({
                data: {
                    registeredUsers: registeredUsers
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
            response.status(500);
            response.send("Internal Server Error");
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
                data: {
                    onlineUsers: onlineUsers
                }
            });
        }
    });
});


export default statisticsRouter;