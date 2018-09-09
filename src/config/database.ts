import dotenv from "dotenv";

dotenv.config({path: "./.env"});

const databaseConfig = {
    requestTimeout: 5000,
    users: {
        hashCharset: process.env.USERS_HASH_CHARSET,
        hashLength: process.env.USERS_HASH_LENGTH,
        passwordHashRounds: process.env.USERS_PASSWORD_HASH_ROUNDS,
        passwordResetTimeLimit: process.env.USERS_PASSWORD_RESET_TIME_LIMIT,
        passwordResetCharset: process.env.USERS_PASSWORD_RESET_CHARSET,
        passwordResetLength: process.env.USERS_PASSWORD_RESET_LENGTH
    }
};

export default databaseConfig;