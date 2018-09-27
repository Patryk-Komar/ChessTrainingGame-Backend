// Creating express router

import express from "express";

const articlesRouter = express.Router();


// Importing MySQL database configuration files

import connection from "../database/connection";
import databaseConfig from "../config/database";


// Main articles API endpoint

articlesRouter.get("/", (request, response) => {
    response.send("Articles API works!");
});


// Get all thematic articles

articlesRouter.get("/all", (request, response) => {
    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT category, title, content FROM \`articles\``,
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
                articles: results,
                success: true
            });
        }
    });
});


// Get thematic article by title

articlesRouter.get("/title=:title", (request, response) => {
    let {
        title: articleTitle
    } = request.params;
    const {
        requestTimeout
    } = databaseConfig;

    articleTitle = articleTitle.replace("_", " ");
    connection.query({
        sql: `SELECT category, title, content FROM \`articles\` WHERE title = ?`,
        timeout: requestTimeout,
        values: [
            articleTitle
        ]
    }, (error, results) => {
        if (error || results.length !== 1) {
            response.status(200);
            response.send({
                message: `We're sorry, article titled ${articleTitle} doesn't exist in our database.`,
                success: false
            });
        } else {
            const [
                article
            ] = results;

            response.status(200);
            response.send({
                article: article,
                success: true
            });
        }
    });
});


export default articlesRouter;
