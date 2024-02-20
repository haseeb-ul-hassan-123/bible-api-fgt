import express, { Express } from "express";
import dotEnvExtended from "dotenv-extended";

import api from "./api/index";

dotEnvExtended.load();

const app: Express = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());


app.use("/api", api);

app.get("/", (req, res) => {
  return res.status(200).json({ body: req.body, status: "Trueee...." });
});

app.listen(port, () => {
  console.log(`⚡️[Server]: Server is running at http://localhost:${port}`);
});

export default app;
