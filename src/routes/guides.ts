// Creating express router

import express from "express";

const guidesArticle = express.Router();


// Importing MySQL database configuration files

import connection from "../database/connection";
import databaseConfig from "../config/database";


// Main guides API endpoint

guidesArticle.get("/", (request, response) => {
    response.send("Guides API works!");
});


// Get all guides

guidesArticle.get("/all", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT title, content FROM \`guides\``,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                success: false
            });
        } else {
            response.status(200);
            response.send({
                guides: results,
                success: true
            });
        }
    });
});


export default guidesArticle;
