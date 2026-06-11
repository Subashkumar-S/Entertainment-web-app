import { IUser } from '../models/userModel';
declare global {
    namespace Express {
        // Passport stores the authenticated user on req.user; model it as our
        // Mongoose user document so serialize/deserialize and controllers line up.
        interface User extends IUser {}

        interface Request {
            isAuthenticated(): boolean;
            user?: IUser;
        }
    }
}