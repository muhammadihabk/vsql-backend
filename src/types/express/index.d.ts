import { IRequestUser } from '../../components/user/user.types';

declare global {
  namespace Express {
    export interface User extends IRequestUser {}
  }
}
