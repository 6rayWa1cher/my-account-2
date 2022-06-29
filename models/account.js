import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  importStrategy: String,
  fireflyAccount: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  automatizationRules: [
    {
      trigger: { type: String, required: true },
      action: { type: String, required: true },
      note: String,
      scope: { type: String, required: true },
    },
  ],
});

const Account = mongoose.model("Account", AccountSchema);

export default Account;
