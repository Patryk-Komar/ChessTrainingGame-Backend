import administrationConfig from "../config/administration";
import environmentConfig from "../config/environment";

const welcomeMailTemplate = (email: string, username: string) => {
    const {
        port
    } = environmentConfig;
    return {
        from: administrationConfig.email.username,
        to: email,
        subject: "Chess Training Game - Your account is now active",
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
                footer {
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
            </style>
        </head>
        <body>
            <div class="wrapper">
                <header>
                    Get ready to brainstorm,<br>
                    <span>
                        ${username}!
                    </span>
                </header>
                <img src="https://static.thenounproject.com/png/144098-200.png" style="max-height: 160px;" alt="Chess figures"><br>
                <main>
                    Your account in Chess Training Game has been activated.<br>
                    Difficult chess tasks and vastness of knowledge are waiting for you!<br>
                    <a href="http://localhost:${port}/">
                        <span class="button">
                            PLAY NOW
                        </span>
                    </a>
                </main>
                <section>
                    <p style="margin-bottom: 10px">
                        This message was auto-generated.
                    </p>
                    <p class="contact">
                        If you wish to contact us, please do not reply to this message<br>but instead go to <a href="http://localhost:${port}/contact">http://www.chesstraininggame.com/contact</a>. Thanks!
                    </p>
                </section>
                <footer>
                    Copyright © Chess Training Game, 2018<br>
                    All right reserved
                </footer>
            </div>
        </body>
        </html>`
    };
};

export default welcomeMailTemplate;