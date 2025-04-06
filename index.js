const express = require("express");
const mongoose = require("mongoose");
const { mongoURI } = require("./config.json"); // Import MongoDB URI
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection using mongoose
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Error connecting to MongoDB:", err));

// MongoDB Schema and Model for Teachings
const teachingSchema = new mongoose.Schema({
  uid: String,
  ask: String,
  answers: [String],
});

const Teaching = mongoose.model("Teaching", teachingSchema);

// Root route to check if API is alive
app.get("/", (req, res) => {
  res.send("Rakib ChatBot API is alive!");
});

// Teach route to add new teaching
app.get("/bby/teach", async (req, res) => {
  const { ask, ans, uid } = req.query;

  if (!ask || !ans || !uid) {
    return res.status(400).json({ message: "Missing ask, ans, or uid" });
  }

  const answers = ans.split(",").map(a => a.trim()).filter(a => a);
  let record = await Teaching.findOne({ uid, ask: ask.toLowerCase() });

  if (record) {
    record.answers.push(...answers); // Add new answers to existing record
    await record.save();
  } else {
    // Create new record if not found
    record = new Teaching({ uid, ask: ask.toLowerCase(), answers });
    await record.save();
  }

  // Calculate total teachings by the user
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

// Chatbot response route
app.get("/bby", async (req, res) => {
  const { text, uid, font } = req.query;

  if (!text || !uid) {
    return res.status(400).json({ message: "Missing text or uid" });
  }

  const record = await Teaching.findOne({ ask: text.toLowerCase() });
  if (!record) {
    return res.json({ text: `Please teach me this sentence! 🦆💨`, react: "🦆" });
  }

  // Randomly pick a reply
  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];

  res.json({ text: `${reply} 🧠`, react: font === "3" ? "🧠" : "" });
});

// Get all messages for a user
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

// Get list of all teachers
app.get("/bby/teachers", async (req, res) => {
  const teachers = await Teaching.distinct("uid");

  res.json({ status: "Success", teachers, react: "🔥" });
});

// Get all teachings/messages
app.get("/bby/allmsgs", async (req, res) => {
  const allMessages = await Teaching.find({});

  const messages = allMessages.map(t => ({
    ask: t.ask,
    ans: t.answers.join(", ")
  }));

  res.json({ messages, react: "💬" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
