import { Router } from 'express';

const userController = Router();

userController.get('/me', (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).send('Unauthorized');
  }

  res.json({
    user,
  });
});

export default userController;
