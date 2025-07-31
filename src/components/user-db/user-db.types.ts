import Dockerode from 'dockerode';

export interface IUserQuery {
  query: string | IBuildQueryUserInput;
  options: {
    database: string;
  };
}

export interface IExecQueryOptions {
  userId: string;
  container: Dockerode.Container;
  query: {
    text: string;
    type?: QueryType;
  };
}

export interface IUserContainerOptions {
  userId: string;
  container: Dockerode.Container;
}

export interface IBuildQueryUserInput {
  query: {
    columns: string[];
    relationships?: {
      [table: string]: {
        [referencedTable: string]: {
          columns: [string, string];
          joinType?: string;
        };
      };
    };
  };
  options: {
    orderBy?: string[];
    limit?: number;
  };
}

export interface ITableRow {
  [columnName: string]: string;
}

export enum QueryType {
  DDL = 'DDL',
  DML = 'DML',
}

export const DB_USER_HOST = process.env.DB_USER_HOST || 'localhost';
