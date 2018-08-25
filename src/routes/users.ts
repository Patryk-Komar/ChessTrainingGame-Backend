// Creating express router

import express from "express";

const usersRouter = express.Router();


// Importing configuration files

import databaseConfig from "../config/database";


// Importing MySQL database connection

import connection from "../database/connection";


// Main users API endpoint

usersRouter.get("/", (request, response) => {
    response.send("Users API works!");
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
                    const {
                        passwordHashRounds
                    } = databaseConfig.users;
                    const rounds = parseInt(passwordHashRounds, 10);
                    bcrypt.hash(password, rounds, (error, hash) => {
                        if (error) {
                            response.send({
                                code: 500,
                                content: "Internal Server Error"
                            });
                        } else {
                            connection.query({
                                sql: `SELECT secret FROM users`,
                                timeout: 5000
                            }, (error, results) => {
                                if (error) {
                                    response.send({
                                        code: 500,
                                        content: "Internal Server Error"
                                    });
                                } else {
                                    const {
                                        hashCharset,
                                        hashLength
                                    } = databaseConfig.users;

                                    let activationHash = "";
                                    let secretAlreadyExists = false;

                                    while (activationHash === "" || secretAlreadyExists) {
                                        for (let i = 0; i < parseInt(hashLength, 10); i++) {
                                            const randomCharNumber = Math.floor(Math.random() * hashCharset.length);
                                            activationHash += hashCharset[randomCharNumber];
                                        }
                                        for (const row of results) {
                                            if (row.secret === activationHash) {
                                                secretAlreadyExists = true;
                                            }
                                        }
                                    }

                                    connection.query({
                                        sql: `INSERT INTO users (username, email, password, firstname, lastname, secret) VALUES (?, ?, ?, ?, ?, ?)`,
                                        timeout: 5000,
                                        values: [
                                            username,
                                            email, hash,
                                            firstName,
                                            lastName,
                                            activationHash]
                                    }, (error) => {
                                        if (error) {
                                            response.send({
                                                code: 500,
                                                content: "Internal Server Error",
                                                e: error
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


// Account activation

usersRouter.get("/signUp/activation/:secret", (request, response) => {
    const {
        secret
    } = request.params;

    connection.query({
        sql: `SELECT COUNT(*) FROM users WHERE secret = ? AND registered IS NULL`,
        timeout: 5000,
        values: [
            secret
        ]
    }, (error, results) => {
        if (error) {
            response.send({
                code: 500,
                content: "Internal Server Error"
            });
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 1) {
                connection.query({
                    sql: `SELECT secret FROM users`,
                    timeout: 5000
                }, (error, results) => {
                    if (error) {
                        response.send({
                            code: 500,
                            content: "Internal Server Error"
                        });
                    } else {
                        const {
                            hashCharset,
                            hashLength
                        } = databaseConfig.users;

                        let newSecret = "";
                        let secretAlreadyExists = false;

                        while (newSecret === "" || secretAlreadyExists) {
                            for (let i = 0; i < parseInt(hashLength, 10); i++) {
                                const randomCharNumber = Math.floor(Math.random() * hashCharset.length);
                                newSecret += hashCharset[randomCharNumber];
                            }
                            for (const row of results) {
                                if (row.secret === newSecret) {
                                    secretAlreadyExists = true;
                                }
                            }
                        }

                        connection.query({
                            sql: `UPDATE users SET secret = ?, registered = NOW() WHERE secret = ?`,
                            timeout: 5000,
                            values: [
                                newSecret,
                                secret
                            ]
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
            } else {
                response.send({
                    code: 400,
                    content: "Bad Request"
                });
            }
        }
    });
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