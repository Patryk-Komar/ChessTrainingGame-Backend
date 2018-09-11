import dotenv from "dotenv";

dotenv.config({path: "./.env"});

const environmentConfig = {
    database: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME,
        charset: process.env.DATABASE_CHARSET
    },
    port: process.env.APPLICATION_PORT
};

export default environmentConfig;
