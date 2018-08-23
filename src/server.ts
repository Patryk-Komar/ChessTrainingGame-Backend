// Getting required dependencies

import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import http from "http";


// Creating application instance

dotenv.config({path: "./.env"});

const port = process.env.PORT || 3000;

const app = express();

app.set("port", port);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("*", (req, res) => {
    res.send("Website index.");
});


// Starting HTTP server

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Application is now running on port ${port}`);
});