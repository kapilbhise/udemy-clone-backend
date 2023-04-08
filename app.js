import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import ErrorMiddleware from "./middlewares/Error.js";

// importing routes
import course from "./routes/courseRoutes.js";
import user from "./routes/userRoutes.js";
import payment from "./routes/paymentRoutes.js";
import other from "./routes/otherRoutes.js";

config({
  path: "./config/config.env",
});

const app = express();

// using middleware
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(cookieParser());

// using routes
app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);

//use middleware
app.use(ErrorMiddleware);

app.get("/", (req, res) => {
  return res.send(
    // `<h1>Site is working properly. Click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
    {
      message: "Site is working properly.",
    }
  );
});
export default app;
