import express, { Express } from "express";
import dotEnvExtended from "dotenv-extended";

import api from "./api/index";
import axios from "axios";

dotEnvExtended.load();

const app: Express = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.use("/api", api);

app.get("/", (req, res) => {
  return res.status(200).json({ body: req.body, status: "Trueee...." });
});

app.get("/api/v1/ping", async (req, res) => {
  let { start, end, book, chapter } = req.query;

  if (!start || !end)
    return res.json({ status: "fail", message: "start or end is missing" });

  const promises = [];
  let arr: Array<any> = [];

  const verseCheck = await axios.get(
    `https://bible-api-gft.vercel.app/api/v1/chapters-verse-list?abbr=${book}&chapter=${chapter}`
  );

  const versesCount = verseCheck.data.data.chapters.verses;

  // if (!end) end = versesCount;

  if (versesCount < end) {
    return res.json({
      status: "fail",
      message: `Unexpected End - There Are Only ${versesCount} Verses On Chapter ${chapter}.`,
    });
  }

  for (let index = +start; index <= +end; index++) {
    console.log("Start");
    promises.push(
      axios
        .get(
          `https://bible-api-2i2u63a2n-syedammad0.vercel.app/api/v1/verse?book=${book}&chapter=${chapter}&verses=${index}`
        )
        .then((e) => {
          arr.push({ verse: index, data: e.data.data });
        })
    );
  }

  await Promise.all(promises);

  return res.status(200).json({ arr: arr.sort((a, b) => a.verse - b.verse) });
});

app.listen(port, () => {
  console.log(`⚡️[Server]: Server is running at http://localhost:${port}`);
});

export default app;
