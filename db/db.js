const { Pool } = require("pg");

let pool = new Pool({
  host: "localhost",
  port: "5432",
  database: "rohith",
  user: "rohith",
  password: "Sairohith@9",
});

module.exports = pool;
