const mysql = require('mysql2/promise');

const con = mysql.createPool({
  host: "localhost",
  user: "panic",
  password: "mysql",
  database: "mydb"
});

module.exports = con;