import { Router } from 'express';
import userDbService from './user-db.service';
import containersInitConfig from '../../config/user-docker/containers-init.config';

const dbController = Router();

dbController.post('/build-schema', async (req, res) => {
  const options: { schema: string; options: any } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  const databaseVendor = options.options.database.toLowerCase();

  if (databaseVendor !== 'mysql') {
    return res.status(500).send('Internal Server Error');
  }

  const container = containersInitConfig.getReadyContainers()?.[databaseVendor];
  if (!container) {
    return res.status(500).send('Internal Server Error');
  }
  await userDbService.createDBUser({ userId: user._id, container });

  const execQueryOptions = {
    userId: user._id,
    container,
    query: options.schema,
  };
  await userDbService.execQuery(execQueryOptions);

  res.sendStatus(200);
});

export default dbController;
