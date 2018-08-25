import dotenv from "dotenv";

dotenv.config({path: "./.env"});

const databaseConfig = {
    users: {
        hashCharset: process.env.USERS_HASH_CHARSET,
        hashLength: process.env.USERS_HASH_LENGTH,
        passwordHashRounds: process.env.USERS_PASSWORD_HASH_ROUNDS
    }
};

export default databaseConfig;