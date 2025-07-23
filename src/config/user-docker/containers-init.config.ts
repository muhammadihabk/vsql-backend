import Dockerode from 'dockerode';
import { docker } from '../../config/user-docker/user-docker.config';

async function createContainer(): Promise<Dockerode.Container> {
  try {
    const containerOptions: Dockerode.ContainerCreateOptions = {
      Image: 'mysql:9.2',
      name: process.env.CONTAINER_NAME,
      Volumes: {
        '/var/lib/mysql': {
          bind: {
            read_only: false,
          },
        },
      },
      Env: [`MYSQL_ROOT_PASSWORD=${process.env.MYSQL_ROOT_PASSWORD}`],
      HostConfig: {
        PortBindings: {
          '3306/tcp': [
            {
              HostPort: '3306',
            },
          ],
        },
      },
    };

    return await docker.createContainer(containerOptions);
  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log('[Info]:', 'Container already exists');
    } else {
      throw error;
    }

    return docker.getContainer(process.env.CONTAINER_NAME!);
  }
}

async function startContainer(container: Dockerode.Container) {
  try {
    await container.start();
  } catch (error: any) {
    if (error.statusCode === 304) {
      console.log('[Info]:', 'Container already started');
    } else {
      throw error;
    }
  }
}

let readyContainers: any = undefined;

async function initContainers() {
  const container = await createContainer();
  await startContainer(container);

  readyContainers = {
    mysql: container,
  };
}

function getReadyContainers() {
  return readyContainers;
}

export default {
  initContainers,
  getReadyContainers,
};
