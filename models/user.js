import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fireflyId: { type: String, unique: true, required: true },
  email: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

export default User;
