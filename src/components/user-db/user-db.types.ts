import Dockerode from 'dockerode';

export interface IExecQueryOptions {
  userId: string;
  container: Dockerode.Container;
  query: string;
}
