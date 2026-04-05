import advising from "./route/advising.js";
import cors from "cors";
import "dotenv/config";
import express from "express";
import users from "./route/user.js";

const app = express();
app.set("etag", false);
const port = 3000;

const myLogger = function (req, res, next) {
  console.log("middleware logged");
  next();
};

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());

app.use(myLogger);
app.use("/user", users);
app.use("/advising", advising);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.all("/test", (req, res) => {
  res.send("Response from all api");
});

app.post("/", (req, res) => {
  res.send("Hello World! from post api");
});

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});

export default app;