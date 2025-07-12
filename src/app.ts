import express from 'express';
import cors from 'cors';
import authController from './components/auth/auth.controller';
import passport, { handlePassportErrors } from './config/auth/passport';
import cookieParser from './common/middlewares/cookie-parser';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser);
app.use('/auth', authController);
app.use(passport.authenticate('jwt', { session: false }), handlePassportErrors);

export default app;
