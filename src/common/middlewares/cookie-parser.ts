import { NextFunction, Request } from 'express';
import * as cookie from 'cookie';

function cookieParser(req: Request, _: any, next: NextFunction) {
  const {
    headers: { cookie: inCookie },
  } = req;
  req.cookies = inCookie ? cookie.parse(inCookie) : {};

  next();
}

export default cookieParser;
