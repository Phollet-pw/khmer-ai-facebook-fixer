/**
 * PORT.js — Khmer AI
 * Export server port from environment variable
 */

const PORT = parseInt(process.env.PORT || "3000", 10);

module.exports = PORT;
