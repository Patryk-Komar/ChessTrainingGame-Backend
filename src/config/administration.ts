import dotenv from "dotenv";

dotenv.config({path: "./.env"});

const administrationConfig = {
    email: {
        host: process.env.ADMIN_EMAIL_HOST,
        username: process.env.ADMIN_EMAIL_USERNAME,
        password: process.env.ADMIN_EMAIL_PASSWORD
    }
};

export default administrationConfig;
