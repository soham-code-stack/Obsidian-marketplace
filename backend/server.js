require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initMeilisearch } = require('./src/config/meilisearch');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initMeilisearch();

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error(`[UnhandledRejection] ${err.message}`);
});

