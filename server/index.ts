import express from 'express';
import session from "express-session";
import dotenv from 'dotenv';
import authRoutes from "./routes/authRoutes";
import passport from "./config/passportConfig";
import connectRedis from "connect-redis";
import redisClient from "./config/redisClient";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const RedisStore = connectRedis(session);
const sessionStore = new RedisStore({ client: redisClient });

app.use(express.json());
app.use(session({
    store: sessionStore,
    secret: process.env.SECRET || "secret",
    resave: false,
    saveUninitialized: false
}))
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.use(passport.initialize());



app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Hello");
})

app.listen(PORT, () => {
    console.log(`App listening on port : ${PORT}`)
})