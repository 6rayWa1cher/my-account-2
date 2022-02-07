import mongoose from "mongoose";

const mongoUrl = process.env.MONGODB_URL;

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

db.once("open", () => {
  console.log("Connected successfully");
});

export const init = () => {
  mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

export default { init };
