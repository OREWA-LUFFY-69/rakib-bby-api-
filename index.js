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

// Function to get random emoji
const getRandomEmojis = () => {
  const emojis = [
    "🙂", "😗", "🥲", "🥸", "😍", "🤢", "💦", "🙄", "🙈", "🤤", "👀", "🤌", "😎", "🧐", "😷", "🤒", 
    "🤕", "🥵", "😔", "🤥", "😏", "😒", "😶‍🌫️", "😌", "😑", "🤨", "🥺", "🥹", "🧐", "😦", "😡", "🤡", 
    "☠️", "💀", "😈", "👽", "👻", "👾", "😹", "🙀", "😾", "😼", "😿", "💩", "💋", "💔", "💓", "❤️‍🩹", 
    "💨", "💭", "💤", "💪", "👅", "👄", "🫦", "🐸", "🦆", "🐣", "🐰", "🌼", "🌸", "🔪", "✨", "🌚", "🌝", 
    "☔", "🌊", "💧", "🔥", "🗿", "🧬", "❌", "⭕", "✅", "🐽", "😶", "😕", "🥴", "💤", "😪", "👩‍❤️‍💋‍👨", "🤰"
  ];
  return [emojis[Math.floor(Math.random() * emojis.length)], emojis[Math.floor(Math.random() * emojis.length)]];
};

// Helper function to remove emojis
const removeEmojis = (text) => {
  return text.replace(/[^\w\s]/g, '');  // This removes non-word characters and emojis
};

// Teach endpoint
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

// Chat endpoint with emoji-insensitive detection
app.get("/bby", async (req, res) => {
  const { text, uid } = req.query;

  if (!text || !uid) {
    return res.status(400).json({ message: "Missing text or uid" });
  }

  // Remove emojis and convert the text to lowercase for insensitive matching
  const sanitizedText = removeEmojis(text).toLowerCase();

  const record = await Teaching.findOne({ ask: sanitizedText });
  if (!record) {
    return res.json({ text: `Please teach me this sentence! 🦆💨`, react: "🦆" });
  }

  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];
  const emojis = getRandomEmojis();

  res.json({ text: `${reply} ${emojis[0]} ${emojis[1]}`, react: "" });
});

// List all messages for a specific user
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
    react: ""
  });
});

// Get list of all teachers
app.get("/bby/teachers", async (req, res) => {
  const teachers = await Teaching.distinct("uid");

  res.json({ status: "Success", teachers, react: "🔥" });
});

// Get all messages
app.get("/bby/allmsgs", async (req, res) => {
  const allMessages = await Teaching.find({});

  const messages = allMessages.map(t => ({
    ask: t.ask,
    ans: t.answers.join(", ")
  }));

  res.json({ messages, react: "💬" });
});

// Edit message route
app.get("/bby/editmsg", async (req, res) => {
  const { ask, uid, newAnswer } = req.query;

  if (!ask || !uid || !newAnswer) {
    return res.status(400).json({ message: "Missing ask, uid, or newAnswer" });
  }

  const record = await Teaching.findOne({ uid, ask: ask.toLowerCase() });
  if (!record) {
    return res.json({ message: "Message not found." });
  }

  record.answers.push(newAnswer);
  await record.save();

  res.json({ message: `Message updated! New answer: ${newAnswer}` });
});

// Delete message route
app.get("/bby/dltmsg", async (req, res) => {
  const { ask, uid } = req.query;

  if (!ask || !uid) {
    return res.status(400).json({ message: "Missing ask or uid" });
  }

  const record = await Teaching.findOne({ uid, ask: ask.toLowerCase() });
  if (!record) {
    return res.json({ message: "Message not found." });
  }

  await Teaching.deleteOne({ uid, ask: ask.toLowerCase() });

  res.json({ message: `Message deleted successfully.` });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
