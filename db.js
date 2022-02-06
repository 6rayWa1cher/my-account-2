const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  a_string: String,
  a_date: Date,
});

module.exports = {
  UserSchema,
};
