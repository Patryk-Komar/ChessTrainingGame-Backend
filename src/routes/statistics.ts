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


export default statisticsRouter;
