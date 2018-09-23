// Getting required dependencies

import bodyParser from "body-parser";
import express from "express";
import http from "http";
import path from "path";


// Importing configuration files

import environmentConfig from "./config/environment";


// Creating application instance

const port = environmentConfig.port || 3000;

const app = express();

app.set("port", port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, process.env.FRONTEND_PATH)));


// Connecting to MySQL database

import connection from "./database/connection";

connection.connect((error) => {
    if (error) {
        console.log(`MySQL connection error: ${error}`);
    }
});


// Setting website endpoints

import usersRouter from "./routes/users";
import statisticsRouter from "./routes/statistics";
import gameRouter from "./routes/game";
import articlesRouter from "./routes/articles";

app.use("/api/users", usersRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/game", gameRouter);
app.use("/api/articles", articlesRouter);

app.get("*", (request, response) => {
    response.sendFile(path.join(__dirname, `${process.env.FRONTEND_PATH}/${process.env.FRONTEND_INDEX}`));
});


// Starting HTTP server

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Application is now running on port ${port}`);
});
