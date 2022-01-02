var express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");
const Emailverify = require("../db/email");

var route = express.Router();

route.get("/login", (req, res) => {
  res.render("login");
});

route.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let errors = [];
  if (!email || !password) {
    errors.push({ message: "Enter Both password and Email" });
    res.render("login", { errors: errors });
  } else {
    const data = await pool.query(`SELECT * FROM user_auth WHERE email=$1`, [
      email,
    ]);
    if (data.rows.length > 0) {
      const user = data.rows[0];
      const decrypt = await bcrypt.compare(password, user.password);
      if (decrypt) {
        try {
          const Find_data = await Emailverify.findOne({ email: email });
          if (Find_data?.isVerified) {
            req.session.userID = user.id;
            res.redirect("/");
          } else {
            errors.push({ message: "Please verify email" });
            res.render("login", { errors: errors });
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        errors.push({ message: "Password Incorrect" });
        res.render("login", { errors: errors });
      }
    } else {
      errors.push({ message: "Email Not registred" });
      res.render("login", { errors: errors });
    }
  }
});

route.get("/logout", async (req, res) => {
  const sessionid = req.sessionID;
  let errors = [];
  const data = await pool.query(
    `SELECT * FROM session WHERE sid = $1`,
    [sessionid],
    (err, results) => {
      if (err) throw err;
      if (results.rows.length > 0) {
        pool.query(
          `DELETE FROM session WHERE sid=$1`,
          [sessionid],
          (err, results) => {
            if (err) {
              throw err;
            } else {
              errors.push({ message: "Logout sucessfully" });
              res.render("login", { errors: errors });
            }
          }
        );
      } else {
        errors.push({ message: "GFO" });
        res.render("login", { errors: errors });
      }
    }
  );
});

module.exports = route;
