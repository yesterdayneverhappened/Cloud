const con = require('../config/db');

const getClient = async (email) => {
    const sql = "SELECT * FROM clients WHERE domain = ?";
    try {
      const [rows] = await con.execute(sql, [email]);
      return rows;
    } catch (err) {
      throw err;
    }
  };

  module.exports = { getClient };