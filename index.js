const app = require('./app');

const { PORT = 50001 } = process.env;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

