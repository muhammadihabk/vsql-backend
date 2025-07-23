import 'dotenv/config';
import db from './config/db/db';
import app from './app';
import containersInitConfig from './config/user-docker/containers-init.config';

async function startServer() {
  await db.connect();

  await containersInitConfig.initContainers();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();
