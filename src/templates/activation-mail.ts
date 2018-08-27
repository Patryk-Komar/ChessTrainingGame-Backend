import administrationConfig from "../config/administration";
import environmentConfig from "../config/environment";

const activationMailTemplate = (email: string, username: string, activationHash: string) => {
    const {
        port
    } = environmentConfig;
    return {
        from: administrationConfig.email.username,
        to: email,
        subject: `Chess Training Game - Account activation`,
        html: `<h3>Welcome, dear ${username}!</h3>
            Thanks for registration in Chess Training Game. Before you start playing, you must activate your account by clicking the button below.<br>
            <a href="http://localhost:${port}/users/signUp/activation/${activationHash}">
                <button>
                    Activate!
                </button>
            </a><br>
            Regards!<br>
            Patryk Komar, Chess Training Game developer`
    };
};

export default activationMailTemplate;