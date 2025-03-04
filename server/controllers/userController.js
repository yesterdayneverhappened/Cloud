const { getClient } = require('../models/userModel');

const getUsers = async (req, res) => {
    const { email } = req.body;
    try {
      const projects = await getClient(email);
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: 'Ошибка при получении проектов', details: err });
    }
  };

  module.exports = { getUsers };