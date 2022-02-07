import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fireflyId: { type: String, unique: true },
  email: String,
});

const User = mongoose.model("User", UserSchema);

export default User;
