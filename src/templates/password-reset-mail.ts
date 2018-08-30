import administrationConfig from "../config/administration";
import environmentConfig from "../config/environment";

const passwordResetMailTemplate = (email: string, username: string, newPassword: string) => {
    const {
        port
    } = environmentConfig;
    return {
        from: administrationConfig.email.username,
        to: email,
        subject: "Chess Training Game - Your account's password has been reset",
        html: `<!doctype html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    height: 100%;
                    background-color: #000000;
                }
                div.wrapper {
                    width: 100%;
                    overflow: hidden;
                    text-align: center;
                    font-family: 'Palatino';
                    font-size: 16px;
                }
                div.wrapper {
                    color: #000000;
                    background-color: #ffffff;
                    padding-top: 10px;
                }
                header {
                    font-size: 20px;
                    margin-bottom: 10px;
                }
                header span {
                    font-size: 36px;
                }
                article {
                    font-size: 12px;
                }
                section p.contact {
                    margin-bottom: 30px;
                    font-size: 16px;
                    line-height: 20px;
                }
                section p.contact a {
                    color: #000000;
                    text-decoration: none;
                    font-weight: bold;
                }
                span.button {
                    display: inline-block;
                    font-size: 16px;
                    margin: 20px 0 30px;
                    padding: 20px;
                    background-color: #000000;
                    color: #ffffff;
                    border-radius: 30px;
                    font-family: 'Metamorphous';
                    font-weight: bold;
                    border: 0;
                    cursor: pointer;
                }
                footer {
                    margin-top: 30px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <header>
                    Welcome to Chess Training Game,<br>
                    <span>
                        ${username}!
                    </span>
                </header>
                <img src="https://static.thenounproject.com/png/144098-200.png" style="max-height: 160px;" alt="Chess figures"><br>
                <main>
                    <p style="margin-bottom: 20px;">
                        You're receiving this message because a password reset request<br>
                        was sent for your account.
                    </p>
                    <p style="margin-bottom: 30px;">
                        Your new password:<br>
                        <span style="font-size: 28px; font-weight: bold;">${newPassword}</span>
                    </p>
                </main>
                <section>
                    <p class="contact">
                        If you wish to contact us, please do not reply to this message<br>but instead go to <a href="http://localhost:${port}/contact">http://www.chesstraininggame.com/contact</a>. Thanks!
                    </p>
                </section>
                <article>
                    <p style="margin-bottom: 10px">
                        If you received this message but did not attempt to reset your password,<br>
                        it means that someone else may have entered your email address, probably by mistake.
                    </p>
                    <p style="margin-bottom: 10px">
                        If this is the case, please sign in to Chess Training Game with a new password<br>
                        and then change it in account administration panel. We apologize for the intrusion.
                    </p>
                </article>
                <footer>
                    Copyright © Chess Training Game, 2018<br>
                    All right reserved
                </footer>
            </div>
        </body>
        </html>`
    };
};

export default passwordResetMailTemplate;