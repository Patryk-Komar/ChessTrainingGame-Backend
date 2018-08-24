import  mysql from "mysql";

import environmentConfig from "./../config/environment";

const {
    database
} = environmentConfig;

const connection = mysql.createConnection({
    host: database.host,
    user: database.user,
    password : database.password,
    database: database.name,
    charset: database.charset
});

export default connection;