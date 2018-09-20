import nodemailer from "nodemailer";

import administrationConfig from "./../config/administration";

const transporter = nodemailer.createTransport({
    host: administrationConfig.email.host,
    port: 465,
    secure: true,
    auth: {
        user: administrationConfig.email.username,
        pass: administrationConfig.email.password
    }
});

export default transporter;
