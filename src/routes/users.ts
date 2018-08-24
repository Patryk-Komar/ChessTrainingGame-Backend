// Creating express router

import express from "express";

const usersRouter = express.Router();


// Connecting to MySQL database

import connection from "../database/connection";

connection.connect((error) => {
    if (error) {
        console.log(`MySQL connection error: ${error}`);
    }
});


// Main users API endpoint

usersRouter.get("/", (request, response) => {
    response.send("Users API works!");
});


// New user registration

import bcrypt from "bcrypt";

import User from "../models/user";

usersRouter.post("/new", (request, response) => {
    const {
        username,
        email,
        password,
        firstName,
        lastName
    } = request.body;

    const newUser = new User(username, email, password, firstName, lastName);

    if (newUser.validate()) {
        connection.query({
            sql: `SELECT * FROM users WHERE username = ? OR email = ?`,
            timeout: 5000,
            values: [username, email]
        }, (error, results) => {
            if (error) {
                response.send({
                    code: 500,
                    content: "Internal Server Error"
                });
            } else {
                if (results.length > 0) {
                    response.send({
                        code: 406,
                        content: "Not Acceptable"
                    });
                } else {
                    bcrypt.hash(password, 10, (error, hash) => {
                        if (error) {
                            response.send({
                                code: 500,
                                content: "Internal Server Error"
                            });
                        } else {
                            connection.query({
                                sql: `INSERT INTO users (username, email, password, firstname, lastname) VALUES (?, ?, ?, ?, ?)`,
                                timeout: 5000,
                                values: [username, email, hash, firstName, lastName]
                            }, (error) => {
                                if (error) {
                                    response.send({
                                        code: 500,
                                        content: "Internal Server Error"
                                    });
                                } else {
                                    response.send({
                                        code: 200,
                                        content: "Success"
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
    } else {
        response.send({
            code: 400,
            content: "Bad Request"
        });
    }
});

export default usersRouter;