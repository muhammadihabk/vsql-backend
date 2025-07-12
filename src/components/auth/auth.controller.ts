import { Router } from 'express';
import UserService from '../user/user.service';
import { DuplicateKeyError } from '../../common/errors';
import { ICreateUser, IUserSignInput } from '../user/user.types';
import { isValidPassword } from '../../config/auth/password';
import { issueJWT } from '../../config/auth/issueJWT';

const authController = Router();

authController.post('/signup', async (req, res) => {
  try {
    const user: ICreateUser = req.body;
    const createdUser = await UserService.create(user);
    if (!createdUser) {
      res.sendStatus(500);
      return;
    }

    const token = issueJWT(createdUser!._id);
    const formatedUserObject = UserService.formatUserObject(createdUser);

    res
      .status(201)
      .cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: Number(process.env.JWT_EXPIRATION),
      })
      .json({
        user: formatedUserObject,
      });
  } catch (error) {
    if (error instanceof DuplicateKeyError) {
      res.sendStatus(409);
    }
  }
});

authController.post('/signin', async (req, res) => {
  const loginInput: IUserSignInput = req.body;
  const user = await UserService.authFindOne({ email: loginInput.email });
  if (!user) {
    console.log("[Auth]: Email isn't found.");
    res.sendStatus(404);
    console.log('404');
    return;
  }
  if (!isValidPassword(loginInput.password, user.salt, user.hash)) {
    console.log(`[Auth]: Invalid credentials for user`, user);
    res.sendStatus(401);
    console.log('401');
    return;
  }

  const token = issueJWT(user._id);
  const formatedUserObject = UserService.formatUserObject(user);

  res
    .cookie('authToken', token, {
      httpOnly: true,
      maxAge: Number(process.env.JWT_EXPIRATION),
    })
    .json({
      user: formatedUserObject,
    });
});

authController.post('/logout', (_, res) => {
  res.clearCookie('authToken').sendStatus(200);
});

export default authController;
