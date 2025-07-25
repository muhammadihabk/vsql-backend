import Dockerode from 'dockerode';

export interface IUserQuery {
  query: string;
  options: {
    database: string;
  };
}

export interface IExecQueryOptions {
  userId: string;
  container: Dockerode.Container;
  query: {
    text: string;
    type: QueryType;
  };
}

export enum QueryType {
  DDL = 'DDL',
  DML = 'DML',
  Root = 'Root',
}
