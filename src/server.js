const express = require("express");
const cors = require("cors");
const aiChatRouter = require("./aiChat.cjs");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", aiChatRouter);

app.get("/", (req, res) => {
  res.send("Khmer AI Backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});