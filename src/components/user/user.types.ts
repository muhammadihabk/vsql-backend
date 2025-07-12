export interface IDBUser {
  _id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser extends Omit<IDBUser, 'salt' | 'hash'> {
  password: string;
}

export interface IFindUserFilter {
  id?: string;
  email?: string;
}

export interface IUser extends Omit<IDBUser, 'salt' | 'hash'> {}

export interface IUserSignInput {
  email: string;
  password: string;
}
