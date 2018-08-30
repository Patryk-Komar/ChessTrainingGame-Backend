// Creating express router

import express from "express";

const usersRouter = express.Router();


// Importing dependencies and configuration files

import bcrypt from "bcrypt";

import transporter from "../admin/transporter";
import databaseConfig from "../config/database";
import connection from "../database/connection";
import User from "../models/user";
import activationMailTemplate from "../templates/activation-mail";
import welcomeMailTemplate from "../templates/welcome-mail";
import passwordResetMailTemplate from "../templates/password-reset-mail";


// Main users API endpoint

usersRouter.get("/", (request, response) => {
    response.send("Users API works!");
});


// Username availability

usersRouter.get("/signUp/username/:username", (request, response) => {
    const {
        username
    } = request.params;

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT COUNT(*) FROM users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.status(200);
                response.send("Success");
            } else {
                response.status(406);
                response.send("Not acceptable");
            }
        }
    });
});


// Email address availability

usersRouter.get("/signUp/email/:email", (request, response) => {
    const {
        email
    } = request.params;

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT COUNT(*) FROM users WHERE email = ?`,
        timeout: requestTimeout,
        values: [
            email
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.status(200);
                response.send("Success");
            } else {
                response.status(406);
                response.send("Not acceptable");
            }
        }
    });
});


// New user registration

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

        const {
            requestTimeout
        } = databaseConfig;

        connection.query({
            sql: `SELECT * FROM users WHERE username = ? OR email = ?`,
            timeout: requestTimeout,
            values: [
                username,
                email
            ]
        }, (error, results) => {
            if (error) {
                response.status(500);
                response.send("Internal Server Error");
            } else {
                if (results.length > 0) {
                    response.status(406);
                    response.send("Not acceptable");
                } else {
                    const {
                        passwordHashRounds
                    } = databaseConfig.users;
                    const rounds = parseInt(passwordHashRounds, 10);
                    bcrypt.hash(password, rounds, (error, hash) => {
                        if (error) {
                            response.status(500);
                            response.send("Internal Server Error");
                        } else {
                            connection.query({
                                sql: `SELECT secret FROM users`,
                                timeout: requestTimeout
                            }, (error, results) => {
                                if (error) {
                                    response.status(500);
                                    response.send("Internal Server Error");
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
                                        timeout: requestTimeout,
                                        values: [
                                            username,
                                            email, hash,
                                            firstName,
                                            lastName,
                                            activationHash
                                        ]
                                    }, (error) => {
                                        if (error) {
                                            response.status(500);
                                            response.send("Internal Server Error");
                                        } else {

                                            const mailOptions = activationMailTemplate(email, username, activationHash);

                                            transporter.sendMail(mailOptions, (error) => {
                                                if (error) {
                                                    response.status(500);
                                                    response.send("Internal Server Error");
                                                } else {
                                                    response.status(200);
                                                    response.send("Success");
                                                }
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
        response.status(400);
        response.send("Bad Request");
    }
});


// Account activation

usersRouter.get("/signUp/activation/:secret", (request, response) => {
    const {
        secret
    } = request.params;

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT username, email FROM users WHERE secret = ? AND registered IS NULL`,
        timeout: requestTimeout,
        values: [
            secret
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else {
            if (results.length === 1) {
                const {
                    username,
                    email
                } = results[0];

                connection.query({
                    sql: `SELECT secret FROM users`,
                    timeout: requestTimeout
                }, (error, results) => {
                    if (error) {
                        response.status(500);
                        response.send("Internal Server Error");
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
                            timeout: requestTimeout,
                            values: [
                                newSecret,
                                secret
                            ]
                        }, (error) => {
                            if (error) {
                                response.status(500);
                                response.send("Internal Server Error");
                            } else {
                                const mailOptions = welcomeMailTemplate(email, username);

                                transporter.sendMail(mailOptions, (error) => {
                                    if (error) {
                                        response.status(500);
                                        response.send("Internal Server Error");
                                    } else {
                                        response.status(200);
                                        response.send("Success");
                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                response.status(400);
                response.send("Bad Request");
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

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT password from users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else {
            if (results.length === 1) {
                const [
                    user
                ] = results;

                bcrypt.compare(password, user.password, (error, success) => {
                    if (error) {
                        response.status(500);
                        response.send("Internal Server Error");
                    } else if (success) {
                        response.status(200);
                        response.send("Success");
                    } else {
                        response.status(406);
                        response.send("Not acceptable");
                    }
                });
            } else {
                response.status(406);
                response.send("Not acceptable");
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

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT password from users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            email
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else {
            if (results.length === 1) {
                const [
                    user
                ] = results;

                bcrypt.compare(password, user.password, (error, success) => {
                    if (error) {
                        response.status(500);
                        response.send("Internal Server Error");
                    } else if (success) {
                        response.status(200);
                        response.send("Success");
                    } else {
                        response.status(406);
                        response.send("Not acceptable");
                    }
                });
            } else {
                response.status(406);
                response.send("Not acceptable");
            }
        }
    });
});


// Password reset

usersRouter.post("/resetPassword", (request, response) => {
    const {
        email
    } = request.body;

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT username, reset FROM users WHERE email = ?`,
        timeout: requestTimeout,
        values: [
            email
        ]
    }, (error, results) => {
        if (error) {
            response.status(500);
            response.send("Internal Server Error");
        } else if (results.length !== 1) {
            response.status(400);
            response.send("Bad Request");
        } else {
            const {
                passwordResetTimeLimit
            } = databaseConfig.users;

            const {
                username,
                reset
            } = results[0];

            const lastReset = reset === null
                ? passwordResetTimeLimit : Date.now() - results[0].reset;
            if (lastReset >= parseInt(passwordResetTimeLimit, 10)) {
                const {
                    passwordHashRounds,
                    passwordResetCharset,
                    passwordResetLength
                } = databaseConfig.users;

                const passwordRegex = new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/);

                let randomPassword = "";

                while (!passwordRegex.test(randomPassword)) {
                    for (let i = 0; i < parseInt(passwordResetLength, 10); i++) {
                        const randomCharNumber = Math.floor(Math.random() * passwordResetCharset.length);
                        randomPassword += passwordResetCharset[randomCharNumber];
                    }
                }
                bcrypt.hash(randomPassword, parseInt(passwordHashRounds, 10), (error, hash) => {
                    if (error) {
                        response.status(500);
                        response.send("Internal Server Error");
                    } else {
                        connection.query({
                            sql: `UPDATE users SET password = ?, reset = NOW() WHERE email = ?`,
                            timeout: requestTimeout,
                            values: [
                                hash,
                                email
                            ]
                        }, (error) => {
                            if (error) {
                                response.status(500);
                                response.send("Internal Server Error");
                            } else {
                                const mailOptions = passwordResetMailTemplate(email, username, randomPassword);

                                transporter.sendMail(mailOptions, (error) => {
                                    if (error) {
                                        response.status(500);
                                        response.send("Internal Server Error");
                                    } else {
                                        response.status(200);
                                        response.send("Success");
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                response.status(406);
                response.send("Not acceptable");
            }
        }
    });
});


// Password change

usersRouter.post("/changePassword",  (request, response) => {
    const {
        email,
        oldPassword,
        newPassword
    } = request.body;

    const passwordRegex = new RegExp(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/);

    if (passwordRegex.test(newPassword)) {
        const {
            requestTimeout
        } = databaseConfig;

        connection.query({
            sql: `SELECT password FROM users WHERE email = ?`,
            timeout: requestTimeout,
            values: [
                email
            ]
        }, (error, results) => {
            if (error) {
                response.status(500);
                response.send("Internal Server Error");
            } else {
                if (results.length === 1) {
                    const [
                        user
                    ] = results;

                    bcrypt.compare(oldPassword, user.password, (error, success) => {
                        if (error) {
                            response.status(500);
                            response.send("Internal Server Error");
                        } else if (success) {
                            const {
                                passwordHashRounds
                            } = databaseConfig.users;

                            const rounds = parseInt(passwordHashRounds, 10);
                            bcrypt.hash(newPassword, rounds, (error, hash) => {
                                if (error) {
                                    response.status(500);
                                    response.send("Internal Server Error");
                                } else {

                                    connection.query({
                                        sql: `UPDATE users SET password = ? WHERE email = ?`,
                                        timeout: requestTimeout,
                                        values: [
                                            hash,
                                            email
                                        ]
                                    }, (error) => {
                                        if (error) {
                                            response.status(500);
                                            response.send("Internal Server Error");
                                        } else {
                                            response.status(200);
                                            response.send("Success");
                                        }
                                    });
                                }
                            });
                        } else {
                            response.status(406);
                            response.send("Not acceptable");
                        }
                    });
                } else {
                    response.status(400);
                    response.send("Bad Request");
                }
            }
        });
    } else {
        response.status(400);
        response.send("Bad Request");
    }
});


export default usersRouter;