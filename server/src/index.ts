import express from 'express';
import session from "express-session";
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoutes";
import favoriteRoutes from "./routes/favoriteRoutes"
import passport from "./config/passportConfig";
import RedisStore from "connect-redis";
import redisClient from "./config/redisClient";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const sessionStore = new RedisStore({ client: redisClient });
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
  };

app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
    store: sessionStore,
    secret: process.env.SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        httpOnly: true,
        sameSite: 'none'
      }
}))
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.use(passport.initialize());
app.use(passport.session());


app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);

// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//     console.error(err.stack);
//     res.status(500).send('Something broke!');
//   });
app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    next();
});


app.listen(PORT, () => {
    console.log(`App listening on port : ${PORT}`)
})