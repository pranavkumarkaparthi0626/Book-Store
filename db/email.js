const mongoose = require("mongoose");

const EmailVerifySchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const Emailverify = mongoose.model("email",EmailVerifySchema)
module.exports = Emailverify
