// Backend/index.js
const express = require('express');
const app = express();

// Use Port 5000 so it never conflicts with your Frontend on Port 3000
const PORT = 5000;

// Middleware to let your server read incoming JSON data from forms
app.use(express.json());

// A simple "Health Check" route to see if the server is breathing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "active", 
    message: "Welcome to the RakhoKhata Backend Engine!" 
  });
});

// Fire up the engine and start listening for frontend requests
app.listen(PORT, () => {
  console.log(`🚀 Backend server running smoothly on http://localhost:${PORT}`);
});