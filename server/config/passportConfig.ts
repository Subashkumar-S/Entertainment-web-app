import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/userModel";
import bcrypt from "bcrypt";
import { IUser } from "../models/userModel";

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    console.log('Authenticating user called: ' + email);
    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return done(null, false, {message: "Email not found"});
        }

        console.log("Retrieved password from database:", user.password);

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log('Incorrect password for user:', email);
            return done(null, false, {message: "Incorrect password"});
        }

        console.log('User authenticated:', email);
        return done(null, user);
    } catch (err) {
        console.error('Error finding user:', err);
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
