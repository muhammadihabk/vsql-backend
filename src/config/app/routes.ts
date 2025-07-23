import { Router } from 'express';
import dbController from '../../components/user-db/user-db.controller';

const router = Router();

router.use('/db', dbController);

export default router;
