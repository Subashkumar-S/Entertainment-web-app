import { IUser } from '../models/userModel';
declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
        }

        interface Request {
            isAuthenticated(): boolean;
            user?: IUser;
        }
    }
}