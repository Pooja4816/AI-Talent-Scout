const express = require('express');
const cors = require('cors');
require('dotenv').config();

const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Agentalent API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
