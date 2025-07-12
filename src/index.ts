import 'dotenv/config';
import db from './config/db/db';
import app from './app';

async function startServer() {
  await db.connect();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();
