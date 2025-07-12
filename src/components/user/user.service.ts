import { generatePassword } from '../../config/auth/password';
import UserRepository from './user.repository';
import { ICreateUser, IDBUser, IFindUserFilter, IUser } from './user.types';

async function create(inUser: ICreateUser) {
  try {
    const { salt, hash } = generatePassword(inUser.password);
    const user: IDBUser = Object.assign(inUser, { salt, hash });

    return await UserRepository.create(user);
  } catch (error) {
    throw error;
  }
}

async function findOne(filter: IFindUserFilter): Promise<IUser | null> {
  const result = await UserRepository.findOne(filter);
  if (!result) {
    return null;
  }

  return formatUserObject(result);
}

async function authFindOne(filter: IFindUserFilter): Promise<IDBUser | null> {
  return await UserRepository.findOne(filter);
}

function formatUserObject(user: IDBUser) {
  const { salt, hash, _id, ...userObject } = user;
  return { ...userObject, _id: _id.toString() };
}

export default {
  create,
  findOne,
  authFindOne,
  formatUserObject,
};
