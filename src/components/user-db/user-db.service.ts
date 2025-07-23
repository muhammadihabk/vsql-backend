import { IExecQueryOptions } from './user-db.types';

async function createDBUser(options: any) {
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
    query: checkUserSql,
  });
  const lines = checkUserResult.split('\n');
  const userExistsIndex = lines.findIndex((line) =>
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
    query: createUserSql,
  };
  await execQuery(execQueryOptions);
}

// TODO: Handle MySQL "access denied" error
async function execQuery(options: IExecQueryOptions) {
  const { userId, container, query: inQuery } = options;

  let userName = process.env.DB_ROOT_USER!;
  let query = inQuery;
  if (userId !== process.env.DB_ROOT_USER) {
    userName = generateUserName(userId);
    const dbName = generateDBName(userId);
    query = `
    DROP DATABASE IF EXISTS ${dbName};
    CREATE DATABASE ${dbName};
    USE ${generateDBName(userId)};
    ${inQuery}`;
  }

  let output = '';
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
    });
    const stream = await exec.start({});

    let errorOutput = '';
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });
    stream.on('error', (err) => {
      errorOutput += err.toString();
    });
    await new Promise((resolve) => stream.on('end', resolve));

    const inspectData = await exec.inspect();
    if (inspectData.ExitCode !== 0) {
      console.error(`Command failed with exit code ${inspectData.ExitCode}:`);
      console.error('Error Output:', errorOutput);
      throw new Error(`MySQL query failed: ${errorOutput}`);
    }

    return output;
  } catch (error) {
    console.log(
      'execQuery()',
      `Error: ${error}
      Output: ${output}`
    );
    throw error;
  }
}

function generateDBName(userId: string) {
  return `user_db_${userId}`;
}

function generateUserName(userId: string) {
  return `user_${userId}`;
}

export default {
  createDBUser,
  execQuery,
};
