const pool = require("../db/db");
const Database = require("../db/email");
let middlewareObject = {};

middlewareObject.auth = async (req, res, next) => {
  await pool.query(
    `SELECT * FROM session WHERE sid = $1`,
    [req.sessionID],
    async(err, results) => {
      if (err) throw err;
      if (results.rows.length > 0) {
        const user = await pool.query(`SELECT * FROM user_auth WHERE id=$1`,[req.session.userID])
        req.user = user.rows
        return next();
      } else {
        return res.redirect("/auth/login");
      }
    }
  );
};

module.exports = middlewareObject;
