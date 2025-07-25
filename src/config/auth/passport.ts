import { Request } from 'express';
import userService from '../../components/user/user.service';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { IRequestUser } from '../../components/user/user.types';

const cookieExtractor = function (req: Request) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['authToken'];
  }

  return token;
};
const secret = process.env.PASSPORT_SECRET;
const options = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  secretOrKey: secret!,
};

async function verifyFn(
  jwtPayload: any,
  done: (error: any, user?: IRequestUser | false) => void
) {
  try {
    const user = await userService.findOne({ id: jwtPayload.sub });

    if (!user) {
      return done(null, false);
    }

    const requestUser: IRequestUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    return done(null, requestUser);
  } catch (error) {
    console.log(
      `[Auth]: Failed to find user with email ${jwtPayload.sub}`,
      error
    );

    return done(new Error('Failed to verify token'), false);
  }
}

const jwtStrategy = new JwtStrategy(options, verifyFn);

passport.use(jwtStrategy);

function handlePassportErrors(err: any, _: any, res: any, next: any) {
  if (err) {
    console.log('[Auth]', err);

    return res.sendStatus(500);
  }
  next();
}

export default passport;
export { handlePassportErrors };
