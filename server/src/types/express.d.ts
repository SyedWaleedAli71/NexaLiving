import {HydratedDocument} from 'mongoose';
import {IUser} from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>;
    }
  }
}
