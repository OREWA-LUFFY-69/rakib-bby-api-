const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const messageSchema = new mongoose.Schema({
  ask: String,
  answers: [String],
  uid: String
});

const Message = mongoose.model("Message", messageSchema);

app.post("/teach", async (req, res) => {
  const { ask, answers, uid } = req.body;
  const message = new Message({ ask, answers, uid });

  try {
    await message.save();
    res.status(200).json({ message: "Teaching recorded successfully!" });
  } catch (err) {
    res.status(400).json({ error: "Failed to save teaching." });
  }
});

app.get("/bby", async (req, res) => {
  const { text, uid } = req.query;
  const message = await Message.findOne({ ask: text });

  if (message) {
    res.json({ text: message.answers.join(", "), react: "" });
  } else {
    res.json({ text: "Please teach me this sentence!🦆💨", react: "" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
