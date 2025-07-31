import { Router, Request } from 'express';
import userDbService from './user-db.service';
import containersInitConfig from '../../config/user-docker/containers-init.config';
import { IUserQuery, QueryType, IBuildQueryUserInput } from './user-db.types';

const dbController = Router();

function getUserAndContainer(req: Request) {
  const user = req.user;
  if (!user) {
    return { error: { status: 401, message: 'Unauthorized' } };
  }

  const options: IUserQuery = req.body;
  const databaseVendor = options?.options?.database?.toLowerCase();
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
  try {
    const { user, container, error } = getUserAndContainer(req);
    if (error) {
      return res.status(error.status).send({ error: error.message });
    }

    await userDbService.createDBUser({ userId: user._id, container });

    const options: IUserQuery = req.body;
    const execQueryOptions = {
      userId: user._id,
      container,
      query: {
        text: options.query as string,
        type: QueryType.DDL,
      },
    };
    await userDbService.execQuery(execQueryOptions);

    res.sendStatus(200);
  } catch (error) {
    console.error('Build schema error:', error);
    res.sendStatus(500);
  }
});

dbController.post('/exec-query', async (req, res) => {
  try {
    const { user, container, error } = getUserAndContainer(req);
    if (error) {
      return res.status(error.status).send({ error: error.message });
    }

    const options: IUserQuery = req.body;
    const execQueryOptions = {
      userId: user._id,
      container,
      query: {
        text: options.query as string,
        type: QueryType.DML,
      },
    };
    const { response, error: execQueryError } = await userDbService.execQuery(
      execQueryOptions
    );
    if (execQueryError) {
      throw new Error(execQueryError);
    }

    const parsedResponse = userDbService.parseQueryResultResponse(response);

    return res.json({ response: parsedResponse });
  } catch (error) {
    console.error('Exec query error:', error);
    res.sendStatus(500);
  }
});

dbController.get('/get-tables-details', async (req, res) => {
  try {
    const { user, container, error } = getUserAndContainer(req);
    if (error) {
      return res.status(error.status).send({ error: error.message });
    }

    const tables = await userDbService.getTablesDetails({
      userId: user._id,
      container,
    });

    return res.json({ tables });
  } catch (err) {
    console.error('Get tables error:', err);
    res.status(500).send('Internal Server Error');
  }
});

dbController.post('/build-query', async (req, res) => {
  try {
    const { user, container, error } = getUserAndContainer(req);
    if (error) {
      return res.status(error.status).send({ error: error.message });
    }

    const userInput: IBuildQueryUserInput = req.body?.query;

    const sqlQuery = userDbService.buildQuery(userInput);

    const execQueryOptions = {
      userId: user._id,
      container,
      query: {
        text: sqlQuery,
      },
    };
    const { response } = await userDbService.execQuery(execQueryOptions);

    const parsedResponse = userDbService.parseQueryResultResponse(response);

    return res.json({ response: parsedResponse });
  } catch (err) {
    console.error('Build query error:', err);
    res.status(500).send('Internal Server Error');
  }
});

dbController.post('/end-session', async (req, res) => {
  try {
    const { user, container, error } = getUserAndContainer(req);
    if (error) {
      return res.status(error.status).send({ error: error.message });
    }
    const response = await userDbService.endSession({
      userId: user._id,
      container,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('End session error:', error);
    return res.sendStatus(500);
  }
});

export default dbController;
