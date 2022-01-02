const { application } = require("express");
const express = require("express");
const pool = require("../db/db");
const route = express.Router();

route.get("/setting", async (req, res) => {
  try {
    let id = req.session.userID;
    await pool.query(
      `SELECT * FROM user_auth WHERE id=$1`,
      [id],
      (err, results) => {
        if (err) throw err;
        if (results.rows.length > 0) {
          let username = results.rows[0].username;
          let email = results.rows[0].email;
          res.render("users_settings", { username: username, email: email });
        } else {  
          req.session.destroy();
          res.redirect("/auth/login");
        }
      }
    );
  } catch (error) {
    res.send(error.message);
  }
});

route.post("/update/profile", async (req, res) => {
  try {
    let id = req.session.userID;
    const { username, email } = req.body;
    await pool.query(
      `UPDATE user_auth SET username = $1, email = $2 WHERE id=$3`,
      [username, email, id],
      (err, results) => {
        if (err) throw err;
        res.render("users_settings", { results: results.command + "D" });
      }
    );
  } catch (error) {
    res.send(error.message);
  }
});

route.post("/update/details", async (req, res) => {
  try {
    const { street, pincode, city, state, phone_number } = req.body;
    const user_id = req.session.userID;
    let errors = [];
    if (!street || !pincode || !city || !state || !phone_number) {
      errors.push({ message: "Need to Fill All fields" });
      res.send(errors);
    } else {
      await pool.query(
        `SELECT * FROM user_details WHERE user_id=$1`,
        [user_id],
        (err, results) => {
          if (err) throw err;
          if (results.rows.length > 0) {
            pool.query(
              `UPDATE user_details SET user_id=$1,street=$2,pincode=$3,city=$4,state=$5,phone_number=$6 RETURNING id`,
              [user_id, street, pincode, city, state, phone_number],
              (err, results) => {
                if (err) throw err;
                if (results.rows.length > 0) {
                  res.send("Updated");
                }
              }
            );
          } else {
            pool.query(
              `INSERT INTO user_details(user_id,street,pincode,city,state,phone_number) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
              [user_id, street, pincode, city, state, phone_number],
              (err, results) => {
                if (err) throw err;
                res.send("Updated");
                console.log(results.rows);
              }
            );
          }
        }
      );
    }
  } catch (error) {
    console.log(error.message);
  }
});


route.get("/delete",(req,res)=>{
  const id = req.userID
  pool.query(`DELETE FROM user_auth WHERE id=$1`,[id],(err,result)=>{
    if(err) throw err
    res.destroy()
  })
})

module.exports = route;
