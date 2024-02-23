import express, { Express } from "express";
import dotEnvExtended from "dotenv-extended";

import api from "./api/index";
import axios from "axios";
import redis from "./cache";

dotEnvExtended.load();

const app: Express = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.use("/api", api);

app.get("/", async (req, res) => {
  await redis.flushall();
  return res
    .status(200)
    .json({ status: "success", message: "Fusion Wave Bible Api" });
});

app.listen(port, async () => {
  console.log(`⚡️[Server]: Express Server is running ${port} `);
});

export default app;
