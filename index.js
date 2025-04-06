const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const db = {
  teaches: []
};

// Root route to check if API is alive
app.get("/", (req, res) => {
  res.send("Rakib ChatBot API is alive!");
});

// Teach route to add new teaching
app.get("/bby/teach", (req, res) => {
  const { ask, ans, uid } = req.query;
  
  // Check if all required parameters are provided
  if (!ask || !ans || !uid) {
    return res.status(400).json({ message: "Missing ask, ans, or uid" });
  }

  const answers = ans.split(",").map(a => a.trim()).filter(a => a);
  let record = db.teaches.find(t => t.uid === uid && t.ask.toLowerCase() === ask.toLowerCase());

  if (record) {
    record.answers.push(...answers); // Add new answers to existing record
  } else {
    // Create new record if not found
    record = { uid, ask, answers };
    db.teaches.push(record);
  }

  // Calculate total teachings by the user
  const totalTeachings = db.teaches.filter(t => t.uid === uid).length;
  
  res.json({
    message: `Teaching recorded successfully!`,
    ask,
    userStats: {
      user: {
        totalTeachings
      }
    },
    react: "🤖" // Directly add emoji in the response
  });
});

// Chatbot response route
app.get("/bby", (req, res) => {
  const { text, uid, font } = req.query;
  
  // Check for missing parameters
  if (!text || !uid) {
    return res.status(400).json({ message: "Missing text or uid" });
  }

  // Find the teaching record
  const record = db.teaches.find(t => t.ask.toLowerCase() === text.toLowerCase());
  if (!record) {
    return res.json({ text: `Please teach me this sentence! 🦆💨`, react: "🦆" });
  }

  // Randomly pick a reply
  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];

  res.json({ text: `${reply} 🧠`, react: font === "3" ? "🧠" : "" });
});

// Get all messages for a user
app.get("/bby/msg", (req, res) => {
  const { ask, uid } = req.query;

  // Validate input parameters
  if (!ask || !uid) {
    return res.status(400).json({ message: "Missing ask or uid" });
  }

  // Find the teaching record
  const record = db.teaches.find(t => t.uid === uid && t.ask.toLowerCase() === ask.toLowerCase());
  if (!record) {
    return res.json({ status: "Not Found", messages: [] });
  }

  // Map answers to messages
  const messages = record.answers.map((ans, i) => ({ index: i, ans }));

  res.json({
    status: "Success",
    ask: record.ask,
    messages,
    react: "🧠" // Add emoji in response
  });
});

// Get list of all teachers
app.get("/bby/teachers", (req, res) => {
  const teachers = [...new Set(db.teaches.map(t => t.uid))]; // Get unique users

  res.json({ status: "Success", teachers, react: "🔥" });
});

// Get all teachings/messages
app.get("/bby/allmsgs", (req, res) => {
  const allMessages = db.teaches.map(t => ({
    ask: t.ask,
    ans: t.answers.join(", ")
  }));

  res.json({ messages: allMessages, react: "💬" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
