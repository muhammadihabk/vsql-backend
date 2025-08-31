import express from 'express';
import cors from 'cors';
import authController from './components/auth/auth.controller';
import passport, { handlePassportErrors } from './config/auth/passport';
import cookieParser from './common/middlewares/cookie-parser';
import router from './config/app/routes';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser);
app.use('/auth', authController);
app.use(passport.authenticate('jwt', { session: false }), handlePassportErrors);
app.use(router);

export default app;
