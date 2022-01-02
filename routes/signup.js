const express = require("express");
const bcrypt = require("bcrypt");
const route = express.Router();
const pool = require("../db/db");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const redis = require("redis");
require("dotenv").config();
const Emailverify = require("../db/email");
const client = redis.createClient();

transporter = nodemailer.createTransport({
  service: "Gmail",
  pool: true,
  auth: {
    user: "rohithchowdary86@gmail.com",
    pass: "Sairohith@9",
  },
});

route.get("/signup", (req, res) => {
  res.render("signup");
});

route.post("/signup", async (req, res) => {
  let { username, email, password, password1 } = req.body;
  let errors = [];
  const re =
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  if (!username || !email || !password || !password1) {
    errors.push({ message: "Enter All Fields" });
  }
  if (!re.test(email)) {
    errors.push({ message: "Email format is Invalid!" });
  }
  if (password != password1) {
    errors.push({ message: "Password1 must be same as Password2" });
  }
  if (errors.length > 0) {
    res.render("signup", { errors: errors });
  } else {
    let hashpassword = await bcrypt.hash(password, 8);
    pool.query(
      `SELECT * FROM user_auth WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        } else {
          if (results.rows.length > 0) {
            errors.push({ message: "Email already Exists!" });
            res.render("signup", { errors: errors });
          } else {
            pool.query(
              `INSERT INTO user_auth(username,email,password) VALUES( $1, $2, $3) RETURNING email`,
              [username, email, hashpassword],
              async (err, results) => {
                if (err) throw err;
                try {
                  let token = await jwt.sign(
                    {
                      email: results.rows[0].email,
                      iat: Math.floor(Date.now() / 1000) - 30,
                    },
                    process.env.JWT_SECRET
                  );
                  if (token) {
                    client.hmset(token, "email", email, async (err, reslut) => {
                      if (err) throw err;
                      mailOptions = {
                        to: email,
                        subject: `Welcome ${username}`,
                        html: `Hello,<br> Please Click on the link to verify your email.<br><a href=http://127.0.0.1:5000/auth/verify?token=${token}>Click here to verify</a>`,
                      };
                      try {
                        const response = await transporter.sendMail(
                          mailOptions
                        );
                        if (response) {
                          errors.push({message:"Email is sent Please check your Gmail or spam"})
                          res.render("signup", { errors: errors });
                        } else {
                          res.send("Hell No");
                        }
                      } catch (error) {
                        console.log("Email error", error);
                        res.send(error);
                      }
                    });
                    client.expire(token, 9000);
                  } else {
                    errors.push({ message: "Error try again" });
                    res.render("signup", { errors: errors });
                  }
                } catch (err) {
                  res.render("signup", { errors: err });
                }
              }
            );
          }
        }
      }
    );
  }
});

route.get("/verify", (req, res) => {
  let { token } = req.query;
  client.hexists(token, "email", (err, isExits) => {
    if (err) throw err;
    if (isExits) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, results) => {
        if (err) throw err;
        try {
          const Find_data = await Emailverify.findOne({ email: results.email });
          if (Find_data?.isVerified) {
            return res.json({ message: "Email already verified" });
          }
          const new_data = await new Emailverify({
            email: results.email,
            isVerified: true,
          });
          await new_data.save((err) => {
            if (err) {
              console.log(err);
            }
          });
          res.json({ message: "Email successfully verified" });
        } catch (error) {
          console.log(error);
        }
      });
    } else {
      res.send("bad");
    }
  });
});

module.exports = route;
