const express = require("express");
const pool = require("../db/db");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

const route = express.Router();

route.get("/getusers", (req, res) => {
  let errors = [];
  pool.query(`SELECT * FROM user_auth`, (err, results) => {
    if (err) throw err;
    if (results.rows.length > 0) {
      res.render("getusers", { user: results.rows });
      // res.json(results.rows);
    } else {
      errors.push({ message: "Dont Have rights" });
      res.render("admin", { errors: errors });
      res.json({ error: errors });
    }
  });
});

route.get("/upload/book", (req, res) => {
  res.render("books");
});

route.post("/upload/book", upload.single("book_image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "bookstore",
    });
    const { name, author, price, description, stock } = req.body;
    const image = req.file.filename;
    const book_image = result.secure_url;
    pool.query(
      `INSERT INTO books(author,price,instock,currentstock,name,description,book_image) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,author,price,instock,name,description,book_image`,
      [author, price, stock, stock, name, description, book_image],
      (err, results) => {
        if (err) throw err;
        res.render("admin", { book: results.rows });
      }
    );
  } catch {
    res.status(400).send("Error");
  }
});

route.get("/getbooks", (req, res) => {
  pool.query(`SELECT * FROM books`, (err, results) => {
    if (err) throw err;
    res.render("admin", {
      book: results.rows,
    });
    // res.json(results.rows);
  });
});

route.post("/updatebook", async (req, res) => {
  const { author, price, name, description, id, stock } = req.body;
  await pool.query(
    `UPDATE books SET author = $1, price = $2, instock = $3, currentstock = $4, name = $5, description = $6 WHERE id=$7 RETURNING  author,price,name,description,book_image`,
    [author, price, stock, stock, name, description, id],
    (err, results) => {
      if (err) throw err;
      res.redirect("/admin/getbooks")
    }
  );
});

route.post("/deletebook", async (req, res) => {
  const { id } = req.body;
  await pool.query(`SELECT * FROM books WHERE id=$1`, [id], (err, results) => {
    if (err) throw err;
    if (results.rows.length > 0) {
      try {
        let url = results.rows[0].book_image.split("/");
        var lastsegment = url[url.length - 1].split(".");
        pool.query(`DELETE FROM books WHERE id = $1`, [id], (err, results) => {
          if (err) throw err;
          cloudinary.uploader.destroy(`bookstore/${lastsegment[0]}`);
          res.redirect("/admin/getbooks");
        });
      } catch {
        res.status(400).redirect("/admin");
      }
    }
  });
});

route.get("/", (req, res) => {
  res.render("index");
});

module.exports = route;
