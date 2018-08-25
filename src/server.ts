// Getting required dependencies

import bodyParser from "body-parser";
import express from "express";
import http from "http";


// Importing configuration files

import environmentConfig from "./config/environment";


// Creating application instance

const port = environmentConfig.port || 3000;

const app = express();

app.set("port", port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


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

app.use("/users", usersRouter);
app.use("/statistics", statisticsRouter);

app.get("*", (request, response) => {
    response.send("Website index.");
});


// Starting HTTP server

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Application is now running on port ${port}`);
});