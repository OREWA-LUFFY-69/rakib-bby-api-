const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Dummy in-memory DB
const db = {
  teaches: [] // { uid, ask, answers: [] }
};

// Home route
app.get("/", (req, res) => {
  res.send("ChatBot API is alive!");
});

// Teach the bot
app.get("/bby/teach", (req, res) => {
  const { ask, ans, uid } = req.query;
  if (!ask || !ans || !uid) {
    return res.status(400).json({ message: "Missing ask, ans, or uid" });
  }

  const answers = ans.split(",").map(a => a.trim()).filter(a => a);
  let record = db.teaches.find(t => t.uid === uid && t.ask.toLowerCase() === ask.toLowerCase());

  if (record) {
    record.answers.push(...answers);
  } else {
    record = { uid, ask, answers };
    db.teaches.push(record);
  }

  const totalTeachings = db.teaches.filter(t => t.uid === uid).length;

  res.json({
    message: "Teaching recorded successfully!",
    ask,
    userStats: {
      user: {
        totalTeachings
      }
    }
  });
});

// Chat with the bot
app.get("/bby", (req, res) => {
  const { text, uid, font } = req.query;
  if (!text || !uid) {
    return res.status(400).json({ text: "Missing text or uid" });
  }

  const record = db.teaches.find(t => t.ask.toLowerCase() === text.toLowerCase());
  if (!record) {
    return res.json({ text: "Please teach me this sentence!🦆💨" });
  }

  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];
  res.json({ text: reply, react: font === "3" ? " 🧠" : "" });
});

// Show answers to a specific question
app.get("/bby/msg", (req, res) => {
  const { ask, uid } = req.query;
  if (!ask || !uid) {
    return res.status(400).json({ message: "Missing ask or uid" });
  }

  const record = db.teaches.find(t => t.uid === uid && t.ask.toLowerCase() === ask.toLowerCase());
  if (!record) {
    return res.json({ status: "Not Found", messages: [] });
  }

  const messages = record.answers.map((ans, i) => ({ index: i, ans }));
  res.json({
    status: "Success",
    ask: record.ask,
    messages
  });
});

// List all teachers (user IDs)
app.get("/bby/teachers", (req, res) => {
  const teachers = [...new Set(db.teaches.map(t => t.uid))];
  res.json({ status: "Success", teachers });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
