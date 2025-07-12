import userModel from './user.model';
import { IDBUser, IFindUserFilter } from './user.types';
import { handleDBErrors } from '../../common/errors';

async function create(user: IDBUser) {
  try {
    return (await userModel.create(user)).toObject();
  } catch (error: any) {
    handleDBErrors(error, 'User');
  }
}

async function findOne(filter: IFindUserFilter): Promise<IDBUser | null> {
  if (filter.id) {
    return await userModel.findById(filter.id).lean();
  }
  return await userModel.findOne({ email: filter.email }).lean();
}

export default {
  create,
  findOne,
};
