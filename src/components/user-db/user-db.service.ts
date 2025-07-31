import { docker } from '../../config/user-docker/user-docker.config';
import {
  IExecQueryOptions,
  IUserContainerOptions,
  QueryType,
} from './user-db.types';

async function createDBUser(options: any) {
  // TODO: Maybe make DB_USER_PASSWORD a seed for the password
  const newUserPassword = process.env.DB_USER_PASSWORD;
  if (!newUserPassword) {
    throw new Error('DB_USER_PASSWORD is not set in environment variables');
  }
  const { userId, container } = options;
  const userName = generateUserName(userId);

  // Check if user already exists in the database
  const checkUserSql = `SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = '${userName}') AS user_exists;`;
  const checkUserResult = await execQuery({
    userId: process.env.DB_ROOT_USER!,
    container,
    query: {
      text: checkUserSql,
      type: QueryType.Root,
    },
  });
  const lines = checkUserResult.split('\n');
  const userExistsIndex = lines.findIndex((line: any) =>
    line.includes('user_exists')
  );
  const userExists = lines[userExistsIndex + 1] === '1';
  if (userExists) {
    return;
  }

  const dbName = generateDBName(userId);
  const createUserSql = `
    CREATE USER '${userName}'@'%' IDENTIFIED BY '${newUserPassword}';
    GRANT CREATE, SELECT, INSERT, UPDATE, DELETE, REFERENCES, ALTER, DROP ON \`${dbName}\`.* TO '${userName}'@'%';
    FLUSH PRIVILEGES;
  `;

  const execQueryOptions = {
    userId: process.env.DB_ROOT_USER!,
    container,
    query: {
      text: createUserSql,
      type: QueryType.Root,
    },
  };
  await execQuery(execQueryOptions);
}

// TODO: Handle MySQL "access denied" error
async function execQuery(options: IExecQueryOptions) {
  const { userId, container, query: inQuery } = options;

  let userName = process.env.DB_ROOT_USER!;
  let query = inQuery.text;
  if (userId !== process.env.DB_ROOT_USER) {
    userName = generateUserName(userId);
    const dbName = generateDBName(userId);
    if (inQuery.type === 'DDL') {
      query = `
      DROP DATABASE IF EXISTS ${dbName};
      CREATE DATABASE ${dbName};
      USE ${generateDBName(userId)};
      ${inQuery.text}`;
    } else {
      query = `
      USE ${dbName};
      ${inQuery.text}`;
    }
  }

  try {
    const exec = await container.exec({
      Cmd: [
        'mysql',
        '-u',
        userName,
        `-p${process.env.MYSQL_ROOT_PASSWORD}`,
        '-e',
        query,
      ],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
    });

    const stream = await exec.start({ hijack: true, stdin: true });

    return await parseDockerStream(stream, exec);
  } catch (error) {
    console.log('execQuery()', `Error: ${error}`);
    throw error;
  }
}

function generateDBName(userId: string) {
  return `user_db_${userId}`;
}

function generateUserName(userId: string) {
  return `user_${userId}`;
}

async function parseDockerStream(stream: any, exec: any): Promise<any> {
  try {
    return new Promise((resolve, reject) => {
      let stdoutBuffer = '';
      let stderrBuffer = '';

      const { Writable } = require('stream');

      const stdoutCollector = new Writable({
        write(chunk: Buffer, _encoding: any, callback: any) {
          stdoutBuffer += chunk.toString('utf8');
          callback();
        },
      });

      const stderrCollector = new Writable({
        write(chunk: Buffer, _encoding: any, callback: any) {
          stderrBuffer += chunk.toString('utf8');
          callback();
        },
      });

      docker.modem.demuxStream(stream, stdoutCollector, stderrCollector);

      stream.on('end', async () => {
        try {
          const inspectData = await exec.inspect();

          let filteredStderr = stderrBuffer
            .split('\n')
            .filter(
              (line) =>
                !line.includes(
                  'Using a password on the command line interface can be insecure'
                )
            )
            .join('\n')
            .trim();

          let sanitizedError = getSanitizedSQLError(filteredStderr);

          if (inspectData.ExitCode !== 0 || sanitizedError) {
            return resolve({
              error:
                sanitizedError ||
                `Command exited with code ${inspectData.ExitCode}`,
            });
          }

          if (filteredStderr) {
            console.warn(
              'MySQL command stderr (warning/info):',
              filteredStderr
            );
          }

          resolve({ response: stdoutBuffer.trim() });
        } catch (err) {
          reject(err);
        }
      });

      stream.on('error', (err: any) => {
        reject(err);
      });

      stream.resume();
    });
  } catch (error) {}
}

function getSanitizedSQLError(errorMessage: any) {
  const sqlStateMatch = errorMessage.match(/\((\w{5})\)/);

  if (sqlStateMatch && sqlStateMatch[1] === '42S02') {
    return errorMessage;
  } else {
    return errorMessage;
  }
}

async function getTablesDetails(options: IUserContainerOptions) {
  const { userId, container } = options;

  const dbName = generateDBName(userId);

  const execQueryOptions = {
    userId,
    container,
    query: {
      text: `
        SELECT 
            t.TABLE_NAME as table_name,
            c.COLUMN_NAME as column_name,
            c.COLUMN_KEY as column_key,
            kcu.REFERENCED_TABLE_NAME as referenced_table,
            kcu.REFERENCED_COLUMN_NAME as referenced_column
        FROM 
            information_schema.TABLES t
        LEFT JOIN 
            information_schema.COLUMNS c ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
            AND t.TABLE_NAME = c.TABLE_NAME
        LEFT JOIN 
            information_schema.KEY_COLUMN_USAGE kcu ON c.TABLE_SCHEMA = kcu.TABLE_SCHEMA 
            AND c.TABLE_NAME = kcu.TABLE_NAME 
            AND c.COLUMN_NAME = kcu.COLUMN_NAME
            AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        WHERE 
            t.TABLE_SCHEMA = '${dbName}'
            AND t.TABLE_TYPE = 'BASE TABLE'
        ;
    `,
    },
  };

  const response = await execQuery(execQueryOptions);
  const parsed = parseGetTablesDetailsResponse(response.response);

  return parsed;
}

function parseGetTablesDetailsResponse(data: string) {
  return data
    .trim()
    .split('\n')
    .slice(1)
    .reduce((schema: any, row) => {
      const [table, column, , refTable, refColumn] = row.split('\t');

      schema[table] ??= { columns: [] };
      schema[table].columns.push(column);

      if (refTable !== 'NULL' && refColumn !== 'NULL') {
        schema[table].relationships ??= {};
        schema[table].relationships[refTable] = [column, refColumn];
      }

      return schema;
    }, {});
}

export default {
  createDBUser,
  execQuery,
  getTablesDetails,
};
