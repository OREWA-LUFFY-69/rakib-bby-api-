const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const db = {
  teaches: []
};

const getRandomEmoji = () => {
  const emojis = ["🤖", "🦆", "🧠", "😾", "👾", "🚀", "💬", "🔥", "💡"];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

app.get("/", (req, res) => {
  res.send("Rakib ChatBot API is alive!");
});

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
  const randomEmoji = getRandomEmoji();

  res.json({
    message: `Teaching recorded successfully! ${randomEmoji}`,
    ask,
    userStats: {
      user: {
        totalTeachings
      }
    }
  });
});

app.get("/bby", (req, res) => {
  const { text, uid, font } = req.query;
  if (!text || !uid) {
    return res.status(400).json({ text: "Missing text or uid" });
  }

  const record = db.teaches.find(t => t.ask.toLowerCase() === text.toLowerCase());
  if (!record) {
    return res.json({ text: `Please teach me this sentence! 🦆💨 ${getRandomEmoji()}` });
  }

  const reply = record.answers[Math.floor(Math.random() * record.answers.length)];
  const randomEmoji = getRandomEmoji();

  res.json({ text: `${reply} ${randomEmoji}`, react: font === "3" ? " 🧠" : "" });
});

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
  const randomEmoji = getRandomEmoji();

  res.json({
    status: "Success",
    ask: record.ask,
    messages,
    react: randomEmoji
  });
});

app.get("/bby/teachers", (req, res) => {
  const teachers = [...new Set(db.teaches.map(t => t.uid))];
  const randomEmoji = getRandomEmoji();

  res.json({ status: "Success", teachers, react: randomEmoji });
});

app.get("/bby/allmsgs", (req, res) => {
  const allMessages = db.teaches.map(t => ({
    ask: t.ask,
    ans: t.answers.join(", ")
  }));
  const randomEmoji = getRandomEmoji();

  res.json({ messages: allMessages, react: randomEmoji });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});    userStats: {
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
