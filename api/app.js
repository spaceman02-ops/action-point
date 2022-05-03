import createError from "http-errors"
import express from "express"
import cookieParser from "cookie-parser"
import logger from "morgan"
import indexRouter from "./routes/index.js"
import cors from "cors"
import content from "./routes/content.js"
import pug from "pug"
const app = express()

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'pug')
app.use("/", indexRouter);
app.use("/content", content);
app.use(function (req, res, next) {
    next(createError(404));
});
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
    res.render("error");
});

app.listen(7777);
console.log("Listening...");
export default app;
