import { Router, Request } from 'express';
import userDbService from './user-db.service';
import containersInitConfig from '../../config/user-docker/containers-init.config';
import { IUserQuery, QueryType } from './user-db.types';

const dbController = Router();

function getUserAndContainer(req: Request) {
  const user = req.user;
  if (!user) {
    return { error: { status: 401, message: 'Unauthorized' } };
  }

  const options: IUserQuery = req.body;
  const databaseVendor = options.options?.database?.toLowerCase();
  if (!databaseVendor) {
    return { error: { status: 400, message: 'Missing database vendor' } };
  }
  if (databaseVendor !== 'mysql') {
    return { error: { status: 400, message: 'Unsupported database vendor' } };
  }

  const container = containersInitConfig.getReadyContainers()?.[databaseVendor];
  if (!container) {
    return {
      error: { status: 500, message: 'Database container not available' },
    };
  }

  return { user, container };
}

// TODO: Merge code of /build-schema and /exec-query and move userDbService.createDBUser to
// when user login. Maybe?
dbController.post('/build-schema', async (req, res) => {
  const { user, container, error } = getUserAndContainer(req);
  if (error) {
    return res.status(error.status).send(error.message);
  }

  await userDbService.createDBUser({ userId: user._id, container });

  const options: IUserQuery = req.body;
  const execQueryOptions = {
    userId: user._id,
    container,
    query: {
      text: options.query,
      type: QueryType.DDL,
    },
  };
  await userDbService.execQuery(execQueryOptions);

  res.sendStatus(200);
});

dbController.post('/exec-query', async (req, res) => {
  const { user, container, error } = getUserAndContainer(req);
  if (error) {
    return res.status(error.status).send(error.message);
  }

  try {
    const options: IUserQuery = req.body;
    const execQueryOptions = {
      userId: user._id,
      container,
      query: {
        text: options.query,
        type: QueryType.DML,
      },
    };
    const result = await userDbService.execQuery(execQueryOptions);

    res.json(result);
  } catch (err) {
    console.error('Exec query error:', err);
    res.status(500).send('Internal Server Error');
  }
});

export default dbController;
