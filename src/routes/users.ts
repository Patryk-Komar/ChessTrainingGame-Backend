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


// Registered users number

usersRouter.get("/statistics/registered", (request, response) => {
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
                    count: results[0][countProperty]
                }
            });
        }
    });
});


// Online users number

usersRouter.get("/statistics/online", (request, response) => {
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


// Username availability

usersRouter.get("/signUp/username/:username", (request, response) => {
    const {
        username
    } = request.params;

    connection.query({
        sql: `SELECT COUNT(*) FROM users WHERE username = ?`,
        timeout: 5000,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.send({
                    code: 200,
                    content: "Success"
                });
            } else {
                response.send({
                    code: 406,
                    content: "Not acceptable"
                });
            }
        }
    });
});


// Email address availability

usersRouter.get("/signUp/email/:email", (request, response) => {
    const {
        email
    } = request.params;

    connection.query({
        sql: `SELECT COUNT(*) FROM users WHERE email = ?`,
        timeout: 5000,
        values: [
            email
        ]
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.send({
                    code: 200,
                    content: "Success"
                });
            } else {
                response.send({
                    code: 406,
                    content: "Not acceptable"
                });
            }
        }
    });
});


// New user registration

import bcrypt from "bcrypt";

import User from "../models/user";

usersRouter.post("/signUp", (request, response) => {
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
            values: [
                username,
                email
            ]
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


// Credentials verification by username

usersRouter.get("/signIn/username/:username/:password", (request, response) => {
    const {
        username,
        password
    } = request.params;

    connection.query({
        sql: `SELECT password from users WHERE username = ?`,
        timeout: 5000,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            if (results.length === 1) {
                const [
                    user
                ] = results;

                bcrypt.compare(password, user.password, (error, success) => {
                    if (error) {
                        response.send({
                            code: 500,
                            content: "Internal Server Error"
                        });
                    } else if (success) {
                        response.send({
                            code: 200,
                            content: "Success"
                        });
                    } else {
                        response.send({
                            code: 406,
                            content: "Not acceptable"
                        });
                    }
                });
            } else {
                response.send({
                    code: 406,
                    content: "Not acceptable"
                });
            }
        }
    });
});


// Credentials verification by email

usersRouter.get("/signIn/email/:email/:password", (request, response) => {
    const {
        email,
        password
    } = request.params;

    connection.query({
        sql: `SELECT password from users WHERE username = ?`,
        timeout: 5000,
        values: [
            email
        ]
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            if (results.length === 1) {
                const [
                    user
                ] = results;

                bcrypt.compare(password, user.password, (error, success) => {
                    if (error) {
                        response.send({
                            code: 500,
                            content: "Internal Server Error"
                        });
                    } else if (success) {
                        response.send({
                            code: 200,
                            content: "Success"
                        });
                    } else {
                        response.send({
                            code: 406,
                            content: "Not acceptable"
                        });
                    }
                });
            } else {
                response.send({
                    code: 406,
                    content: "Not acceptable"
                });
            }
        }
    });
});


export default usersRouter;