const express = require("express");
const mongoose = require("mongoose");
const { mongoURI } = require("./config.json");
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Error connecting to MongoDB:", err));

const teachingSchema = new mongoose.Schema({
  uid: String,
  ask: String,
  answers: [String],
});

const Teaching = mongoose.model("Teaching", teachingSchema);

app.get("/", (req, res) => {
  res.send("Rakib ChatBot API is alive!");
});

app.get("/bby/teach", async (req, res) => {
  const { ask, ans, uid } = req.query;

  if (!ask || !ans || !uid) {
    return res.status(400).json({ message: "Missing ask, ans, or uid" });
  }

  const answers = ans.split(",").map(a => a.trim()).filter(a => a);
  let record = await Teaching.findOne({ uid, ask: ask.toLowerCase() });

  if (record) {
    record.answers.push(...answers);
    await record.save();
  } else {
    record = new Teaching({ uid, ask: ask.toLowerCase(), answers });
    await record.save();
  }

  const totalTeachings = await Teaching.countDocuments({ uid });

  const responseMessage = `✅ Bot taught!\n\n❓ Ask: ${ask}\n✍️ Answers: ${answers.join(", ")}\n📚 You taught: ${totalTeachings} times`;

  res.json({
    message: responseMessage,
    ask,
    userStats: {
      user: {
        totalTeachings
      }
    },
    react: "🤖"
  });
});

app.get("/bby", async (req, res) => {
  const { text, uid, font } = req.query;

  if (!text || !uid) {
    return res.status(400).json({ message: "Missing text or uid" });
  }

  const record = await Teaching.findOne({ ask: text.toLowerCase() });
  if (!record) {
    return res.json({ text: `Please teach me this sentence! 🦆💨`, react: "🦆" });
  }

  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];

  res.json({ text: `${reply} 🧠`, react: font === "3" ? "🧠" : "" });
});

app.get("/bby/msg", async (req, res) => {
  const { ask, uid } = req.query;

  if (!ask || !uid) {
    return res.status(400).json({ message: "Missing ask or uid" });
  }

  const record = await Teaching.findOne({ uid, ask: ask.toLowerCase() });
  if (!record) {
    return res.json({ status: "Not Found", messages: [] });
  }

  const messages = record.answers.map((ans, i) => ({ index: i, ans }));

  res.json({
    status: "Success",
    ask: record.ask,
    messages,
    react: "🧠"
  });
});

app.get("/bby/teachers", async (req, res) => {
  const teachers = await Teaching.distinct("uid");

  res.json({ status: "Success", teachers, react: "🔥" });
});

app.get("/bby/allmsgs", async (req, res) => {
  const allMessages = await Teaching.find({});

  const messages = allMessages.map(t => ({
    ask: t.ask,
    ans: t.answers.join(", ")
  }));

  res.json({ messages, react: "💬" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
