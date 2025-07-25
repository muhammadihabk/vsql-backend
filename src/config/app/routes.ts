import { Router } from 'express';
import dbController from '../../components/user-db/user-db.controller';
import userController from '../../components/user/user.controller';

const router = Router();

router.use('/db', dbController);
router.use('/user', userController);

export default router;
