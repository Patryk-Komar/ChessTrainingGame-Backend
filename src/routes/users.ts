// Creating express router

import express from "express";

const usersRouter = express.Router();


// Importing dependencies and configuration files

import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";

import transporter from "../admin/transporter";
import databaseConfig from "../config/database";
import environmentConfig from "../config/environment";
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

usersRouter.post("/signUp/username/availability", (request, response) => {
    const {
        username
    } = request.body;

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
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.status(200);
                response.send({
                    success: true
                });
            } else {
                response.status(200);
                response.send({
                    success: false
                });
            }
        }
    });
});


// Email address availability

usersRouter.post("/signUp/email/availability", (request, response) => {
    const {
        email
    } = request.body;

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
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            const countProperty = "COUNT(*)";
            if (results[0][countProperty] === 0) {
                response.status(200);
                response.send({
                    success: true
                });
            } else {
                response.status(200);
                response.send({
                    success: false
                });
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
                response.status(200);
                response.send({
                    error: "Internal Server Error",
                    success: false
                });
            } else {
                if (results.length > 0) {
                    response.status(200);
                    response.send({
                        message: "An account already exists with this username or email. Please create a new account or use the password reminder function.",
                        success: false
                    });
                } else {
                    const {
                        passwordHashRounds
                    } = databaseConfig.users;
                    const rounds = parseInt(passwordHashRounds, 10);
                    bcrypt.hash(password, rounds, (error, hash) => {
                        if (error) {
                            response.status(200);
                            response.send({
                                error: "Internal Server Error",
                                success: false
                            });
                        } else {
                            connection.query({
                                sql: `SELECT secret FROM users`,
                                timeout: requestTimeout
                            }, (error, results) => {
                                if (error) {
                                    response.status(200);
                                    response.send({
                                        error: "Internal Server Error",
                                        success: false
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
                                            response.status(200);
                                            response.send({
                                                error: "Internal Server Error",
                                                success: false
                                            });
                                        } else {

                                            const mailOptions = activationMailTemplate(email, username, activationHash);

                                            transporter.sendMail(mailOptions, (error) => {
                                                if (error) {
                                                    response.status(200);
                                                    response.send({
                                                        error: "Internal Server Error",
                                                        success: false
                                                    });
                                                } else {
                                                    response.status(200);
                                                    response.send({
                                                        success: true
                                                    });
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
        response.status(200);
        response.send({
            message: "You entered wrong data. Please check if all information are correct and try again.",
            success: false
        });
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
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
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
                        response.status(200);
                        response.send({
                            error: "Internal Server Error",
                            success: false
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
                            sql: `UPDATE users SET secret = ?, registered = NOW() WHERE secret = ?;
                                    INSERT INTO \`one-move-checkmates-scores\` (username) VALUES ('${username}');
                                    INSERT INTO \`two-moves-checkmates-scores\` (username) VALUES ('${username}');
                                    INSERT INTO \`three-moves-checkmates-scores\` (username) VALUES ('${username}');
                                    INSERT INTO \`stalemates-scores\` (username) VALUES ('${username}');
                                    INSERT INTO \`double-attacks-scores\` (username) VALUES ('${username}');`,
                            timeout: requestTimeout,
                            values: [
                                newSecret,
                                secret
                            ]
                        }, (error) => {
                            if (error) {
                                response.status(200);
                                response.send({
                                    error: "Internal Server Error",
                                    success: false
                                });
                            } else {
                                const mailOptions = welcomeMailTemplate(email, username);
                                transporter.sendMail(mailOptions, (error) => {
                                    if (error) {
                                        response.status(200);
                                        response.send({
                                            error: "Internal Server Error",
                                            success: false
                                        });
                                    } else {
                                        response.status(200);
                                        response.send({
                                            success: true
                                        });
                                    }
                                });
                            }
                        });

                    }
                });
            } else {
                response.status(200);
                response.send({
                    message: "It seems your account has been activated already.",
                    success: false
                });
            }
        }
    });
});


// Credentials verification by username

usersRouter.post("/signIn/username", (request, response) => {
    const {
        username,
        password
    } = request.body;

    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT password, registered from users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            if (results.length === 1) {
                const [{
                    password: userPassword,
                    registered
                }] = results;

                if (!registered) {
                    response.status(200);
                    response.send({
                        message: "Your account hasn't been activated yet. Please check your Inbox and follow the instructions.",
                        success: false
                    });
                } else {
                    bcrypt.compare(password, userPassword, (error, success) => {
                        if (error) {
                            response.status(200);
                            response.send({
                                error: "Internal Server Error",
                                success: false
                            });
                        } else if (success) {
                            response.status(200);
                            response.send({
                                success: true
                            });
                        } else {
                            response.status(200);
                            response.send({
                                message: "You entered incorrect credentials, please try again.",
                                success: false
                            });
                        }
                    });
                }
            } else {
                response.status(200);
                response.send({
                    message: "You entered incorrect credentials, please try again.",
                    success: false
                });
            }
        }
    });
});


// Credentials verification by email

usersRouter.post("/signIn/email", (request, response) => {
    const {
        email,
        password
    } = request.body;

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
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else {
            if (results.length === 1) {
                const [{
                    password: userPassword,
                    registered
                }] = results;
                if (!registered) {
                    response.status(200);
                    response.send({
                        message: "Your account hasn't been activated yet. Please check your Inbox and follow the instructions.",
                        success: false
                    });
                } else {
                    bcrypt.compare(password, userPassword, (error, success) => {
                        if (error) {
                            response.status(200);
                            response.send({
                                error: "Internal Server Error",
                                success: false
                            });
                        } else if (success) {
                            response.status(200);
                            response.send({
                                success: true
                            });
                        } else {
                            response.status(200);
                            response.send({
                                message: "You entered incorrect credentials, please try again.",
                                success: false
                            });
                        }
                    });
                }
            } else {
                response.status(200);
                response.send({
                    message: "You entered incorrect credentials, please try again.",
                    success: false
                });
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
            response.status(200);
            response.send({
                error: "Internal Server Error",
                success: false
            });
        } else if (results.length !== 1) {
            response.status(200);
            response.send({
                message: "You entered incorrect credentials, please try again.",
                success: false
            });
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
                        response.status(200);
                        response.send({
                            error: "Internal Server Error",
                            success: false
                        });
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
                                response.status(200);
                                response.send({
                                    error: "Internal Server Error",
                                    success: false
                                });
                            } else {
                                const mailOptions = passwordResetMailTemplate(email, username, randomPassword);

                                transporter.sendMail(mailOptions, (error) => {
                                    if (error) {
                                        response.status(200);
                                        response.send({
                                            error: "Internal Server Error",
                                            success: false
                                        });
                                    } else {
                                        response.status(200);
                                        response.send({
                                            success: true
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                response.status(200);
                response.send({
                    message: "Password was reset for your account in last two weeks. In order to reset it again, you have to wait.",
                    success: false
                });
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

    const passwordRegex = new RegExp(/^[A-Za-z\d.!@#$%^^&*-_](?=.*[A-Za-z])(?=.*\d)[A-Za-z\d.!@#$%^&*-_]{7,19}$/);

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
                response.status(200);
                response.send({
                    error: "Internal Server Error",
                    success: false
                });
            } else {
                if (results.length === 1) {
                    const [
                        user
                    ] = results;

                    bcrypt.compare(oldPassword, user.password, (error, success) => {
                        if (error) {
                            response.status(200);
                            response.send({
                                error: "Internal Server Error",
                                success: false
                            });
                        } else if (success) {
                            const {
                                passwordHashRounds
                            } = databaseConfig.users;

                            const rounds = parseInt(passwordHashRounds, 10);
                            bcrypt.hash(newPassword, rounds, (error, hash) => {
                                if (error) {
                                    response.status(200);
                                    response.send({
                                        error: "Internal Server Error",
                                        success: false
                                    });
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
                                            response.status(200);
                                            response.send({
                                                error: "Internal Server Error",
                                                success: false
                                            });
                                        } else {
                                            response.status(200);
                                            response.send({
                                                success: true
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            response.status(200);
                            response.send({
                                error: "Not acceptable",
                                success: false
                            });
                        }
                    });
                } else {
                    response.status(200);
                    response.send({
                        message: "You entered wrong current password, please correct it and try again.",
                        success: false
                    });
                }
            }
        });
    } else {
        response.status(200);
        response.send({
            message: "Your new password must contain at 8-20 characters including at least one letter and one digit.",
            success: false
        });
    }
});


// Get user avatar to display it on player profile

usersRouter.get("/avatars/:secret", (request, response) => {
    const {
        secret
    } = request.params;

    const {
        playersAvatars
    } = environmentConfig.paths;

    fs.exists(`${playersAvatars}/${secret}`, exists => {
        if (exists) {
            response.status(200);
            response.sendFile(`${playersAvatars}/${secret}`, { root: "./" });
        } else {
            response.status(200);
            response.send({
                success: false
            });
        }
    });
});


usersRouter.post("/avatar/get", (request, response) => {
    const {
        username,
        password
    } = request.body;
    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT password, secret FROM users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error || results.length !== 1) {
            response.status(200);
            response.send({
                success: false
            });
        } else {
            const [{
                password: userPassword,
                secret
            }] = results;

            bcrypt.compare(password, userPassword, (error, success) => {
                if (!error && success) {

                    const {
                        playersAvatars
                    } = environmentConfig.paths;

                    fs.exists(`${playersAvatars}/${secret}.jpg`, exists => {
                        if (exists) {
                            response.status(200);
                            response.send({
                                path: `http://localhost:1337/api/users/avatars/${secret}.jpg`,
                                success: true
                            });
                        } else {
                            fs.exists(`${playersAvatars}/${secret}.png`, exists => {
                                if (exists) {
                                    response.status(200);
                                    response.send({
                                        path: `http://localhost:1337/api/users/avatars/${secret}.png`,
                                        success: true
                                    });
                                } else {
                                    response.status(200);
                                    response.send({
                                        success: false
                                    });
                                }
                            });
                        }
                    });
                } else {
                    response.status(200);
                    response.send({
                        success: false
                    });
                }
            });
        }
    });
});


// Get user secret

usersRouter.post("/secret", (request, response) => {
    const {
        username,
        password
    } = request.body;
    const {
        requestTimeout
    } = databaseConfig;

    connection.query({
        sql: `SELECT password, secret FROM users WHERE username = ?`,
        timeout: requestTimeout,
        values: [
            username
        ]
    }, (error, results) => {
        if (error || results.length !== 1) {
            response.status(200);
            response.send({
                error: error,
                success: false
            });
        } else {
            const [{
                password: userPassword,
                secret
            }] = results;
            bcrypt.compare(password, userPassword, (error, success) => {
                if (error) {
                    response.status(200);
                    response.send({
                        error: error,
                        success: false
                    });
                } else if (success) {
                    response.status(200);
                    response.send({
                        secret: secret,
                        success: true
                    });
                } else {
                    response.status(200);
                    response.send({
                        error: error,
                        success: false
                    });
                }
            });
        }
    });
});


// Upload player avatar to server

const storage = multer.diskStorage({
    destination: (request, file, callback) => {
        const {
            playersAvatars
        } = environmentConfig.paths;
        callback(undefined, playersAvatars);
    },
    filename: (request, file, callback) => {
        callback(undefined, file.originalname);
    }
});

const upload = multer({storage: storage}).single("file");

usersRouter.post("/avatar/upload", (request, response) => {
    upload(request, response, error => {
        if (error) {
            response.send({
                success: false
            });
        }
        else {
            response.send({
                success: true
            });
        }
    });
});


// Get player scores and achievements

usersRouter.post("/scores", (request, response) => {
    const {
        username
    } = request.body;
    const {
        requestTimeout
    } = databaseConfig;

    const oneMoveCheckmatesTable = "\`one-move-checkmates\`";
    const twoMovesCheckmatesTable = "\`two-moves-checkmates\`";
    const threeMovesCheckmatesTable = "\`three-moves-checkmates\`";
    const stalematesTable = "\`stalemates\`";
    const doubleAttacksTable = "\`double-attacks\`";

    connection.query({
        sql: `SELECT
            (SELECT COUNT(*) FROM ${oneMoveCheckmatesTable}) AS count1,
            (SELECT COUNT(*) FROM ${twoMovesCheckmatesTable}) AS count2,
            (SELECT COUNT(*) FROM ${threeMovesCheckmatesTable}) AS count3,
            (SELECT COUNT(*) FROM ${stalematesTable}) AS count4,
            (SELECT COUNT(*) FROM ${doubleAttacksTable}) AS count5
            FROM dual`,
        timeout: requestTimeout
    }, (error, results) => {
        if (error) {
            response.status(200);
            response.send({
                error: error,
                success: false
            });
        } else {
            const [
                result
            ] = results;
            const responseObject = {
                scores: {
                    oneMoveCheckmate: {
                        completed: 0,
                        levels: result.count1
                    },
                    twoMovesCheckmate: {
                        completed: 0,
                        levels: result.count2
                    },
                    threeMovesCheckmate: {
                        completed: 0,
                        levels: result.count3
                    },
                    stalemate: {
                        completed: 0,
                        levels: result.count4
                    },
                    doubleAttack: {
                        completed: 0,
                        levels: result.count5
                    },
                },
                achievements: {
                    oneMoveCheckmate: false,
                    twoMovesCheckmate: false,
                    threeMovesCheckmate: false,
                    stalemate: false,
                    doubleAttack: false,
                },
                success: false
            };

            const oneMoveCheckmatesScoresTable = "\`one-move-checkmates-scores\`";
            const twoMovesCheckmatesScoresTable = "\`two-moves-checkmates-scores\`";
            const threeMovesCheckmatesScoresTable = "\`three-moves-checkmates-scores\`";
            const stalematesScoresTable = "\`stalemates-scores\`";
            const doubleAttacksScoresTable = "\`double-attacks-scores\`";

            connection.query({
                sql: `SELECT * FROM ${oneMoveCheckmatesScoresTable} WHERE username = ?`,
                timeout: requestTimeout,
                values: [
                    username
                ]
            }, (error, rows) => {
                if (error) {
                    response.status(200);
                    response.send({
                        error: error,
                        success: false
                    });
                } else {
                    let completedLevels = 0;
                    for (const property in rows[0]) {
                        if (property !== "username") {
                            if (rows[0][property] !== null) {
                                completedLevels++;
                            }
                        }
                    }
                    responseObject.scores.oneMoveCheckmate.completed = completedLevels;
                    const {
                        completed,
                        levels
                    } = responseObject.scores.oneMoveCheckmate;
                    if (completed === levels) {
                        responseObject.achievements.oneMoveCheckmate = true;
                    }
                    connection.query({
                        sql: `SELECT * FROM ${twoMovesCheckmatesScoresTable} WHERE username = ?`,
                        timeout: requestTimeout,
                        values: [
                            username
                        ]
                    }, (error, rows) => {
                        if (error) {
                            response.status(200);
                            response.send({
                                error: error,
                                success: false
                            });
                        } else {
                            completedLevels = 0;
                            for (const property in rows[0]) {
                                if (property !== "username") {
                                    if (rows[0][property] !== null) {
                                        completedLevels++;
                                    }
                                }
                            }
                            responseObject.scores.twoMovesCheckmate.completed = completedLevels;
                            const {
                                completed,
                                levels
                            } = responseObject.scores.twoMovesCheckmate;
                            if (completed === levels) {
                                responseObject.achievements.twoMovesCheckmate = true;
                            }
                            connection.query({
                                sql: `SELECT * FROM ${threeMovesCheckmatesScoresTable} WHERE username = ?`,
                                timeout: requestTimeout,
                                values: [
                                    username
                                ]
                            }, (error, rows) => {
                                if (error) {
                                    response.status(200);
                                    response.send({
                                        error: error,
                                        success: false
                                    });
                                } else {
                                    completedLevels = 0;
                                    for (const property in rows[0]) {
                                        if (property !== "username") {
                                            if (rows[0][property] !== null) {
                                                completedLevels++;
                                            }
                                        }
                                    }
                                    responseObject.scores.threeMovesCheckmate.completed = completedLevels;
                                    const {
                                        completed,
                                        levels
                                    } = responseObject.scores.threeMovesCheckmate;
                                    if (completed === levels) {
                                        responseObject.achievements.threeMovesCheckmate = true;
                                    }
                                    connection.query({
                                        sql: `SELECT * FROM ${stalematesScoresTable} WHERE username = ?`,
                                        timeout: requestTimeout,
                                        values: [
                                            username
                                        ]
                                    }, (error, rows) => {
                                        if (error) {
                                            response.status(200);
                                            response.send({
                                                error: error,
                                                success: false
                                            });
                                        } else {
                                            completedLevels = 0;
                                            for (const property in rows[0]) {
                                                if (property !== "username") {
                                                    if (rows[0][property] !== null) {
                                                        completedLevels++;
                                                    }
                                                }
                                            }
                                            responseObject.scores.stalemate.completed = completedLevels;
                                            const {
                                                completed,
                                                levels
                                            } = responseObject.scores.stalemate;
                                            if (completed === levels) {
                                                responseObject.achievements.stalemate = true;
                                            }
                                            connection.query({
                                                sql: `SELECT * FROM ${doubleAttacksScoresTable} WHERE username = ?`,
                                                timeout: requestTimeout,
                                                values: [
                                                    username
                                                ]
                                            }, (error, rows) => {
                                                if (error) {
                                                    response.status(200);
                                                    response.send({
                                                        error: error,
                                                        success: false
                                                    });
                                                } else {
                                                    completedLevels = 0;
                                                    for (const property in rows[0]) {
                                                        if (property !== "username") {
                                                            if (rows[0][property] !== null) {
                                                                completedLevels++;
                                                            }
                                                        }
                                                    }
                                                    responseObject.scores.doubleAttack.completed = completedLevels;
                                                    const {
                                                        completed,
                                                        levels
                                                    } = responseObject.scores.doubleAttack;
                                                    if (completed === levels) {
                                                        responseObject.achievements.doubleAttack = true;
                                                    }
                                                    responseObject.success = true;
                                                    response.send(responseObject);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


export default usersRouter;
