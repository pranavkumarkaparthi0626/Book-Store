const express = require("express");
const pool = require("../db/db");
const route = express.Router();

route.get("/", (req, res) => {
  pool.query(`SELECT * FROM books`, (err, results) => {
    if (err) throw err;
    res.render("home", { books: results.rows });
  });
});

module.exports = route;
