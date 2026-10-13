const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`InstaLite is running at http://localhost:${port}`);
  });
}

module.exports = app;
