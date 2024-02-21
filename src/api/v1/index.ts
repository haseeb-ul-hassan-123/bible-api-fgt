import express, { Router } from "express";
import { faker } from "@faker-js/faker";
import axios from "axios";
import redis from "../../cache";
// Router
const router: Router = express.Router();

const status = require("./status");
const verse = require("./verse/verse");

router.use("/status", status);
router.use("/verse", verse);

router.route("/versions").get(async (req, res) => {
  const redisQueryName = JSON.stringify({
    url: "/api/v1/versions",
    query: {},
  });

  const resp = await redis.get(redisQueryName);

  if (resp) {
    const parsedResp = JSON.parse(resp);
    return res.json({
      status: "success",
      fromCache: true,
      data: { length: parsedResp.length, docs: parsedResp },
    });
  }
  const versions = require("./db/versions-list.json");

  await redis.set(redisQueryName, JSON.stringify(versions));

  return res.status(200).json({
    status: "success",
    fromCache: false,
    data: { length: versions.length, docs: versions },
  });
});

router.route("/books").get(async (req, res) => {
  const redisQueryName = JSON.stringify({
    url: "/api/v1/books",
    query: {},
  });

  const resp = await redis.get(redisQueryName);

  if (resp) {
    const parsedResp = JSON.parse(resp);
    return res.json({
      status: "success",
      fromCache: true,
      data: { length: parsedResp.length, docs: parsedResp },
    });
  }

  const books = require("./db/books.json");

  await redis.set(redisQueryName, JSON.stringify(books));

  return res.status(200).json({
    status: "success",
    fromCache: false,
    data: { length: books.length, docs: books },
  });
});

router.route("/chapters-verse-list").get(async (req, res) => {
  const { alias, chapter } = req.query;

  const redisQueryName = JSON.stringify({
    url: "chapters-verse-list",
    query: { alias, chapter },
  });

  const resp = await redis.get(redisQueryName);

  if (resp) {
    const parsedResp = JSON.parse(resp);
    return res.json({
      status: "success",
      fromCache: true,
      data: { length: parsedResp.length, docs: parsedResp },
    });
  }

  let verseList = require("./db/chapters-verse-list.json");

  if (alias) {
    const indexOf = verseList.findIndex((e: any) => e.alias === alias);
    if (indexOf != -1) verseList = verseList[indexOf];
    else res.status(400).json({ status: "fail", msg: `wrong abbr: ${alias}` });
  }

  if (chapter) {
    const payload = {
      chapters: verseList.chapters[+chapter - 1],
      book: { name: verseList.book, abbr: verseList.abbr },
    };

    await redis.set(redisQueryName, JSON.stringify(payload));

    return res.status(200).json({
      status: "success",
      fromCache: false,
      data: { ...payload },
    });
  }
});

router.get("/verse-with-index", async (req, res) => {
  let { start, end, book, chapter } = req.query;
  const redisQueryName = JSON.stringify({
    url: "/verse-with-index",
    query: { start, end, book, chapter },
  });

  const resp = await redis.get(redisQueryName);
  if (resp) {
    const parsedResp = JSON.parse(resp);
    return res.json({
      status: "success",
      fromCache: true,
      data: { length: parsedResp.length, docs: parsedResp },
    });
  }

  // if (!start || !end)
  //   return res.json({ status: "fail", message: "start or end is missing" });

  const promises = [];
  let docArr: Array<any> = [];

  console.log(book, chapter);

  const localUrl = "http://localhost:4000/api/v1";
  const prodUrl = "https://bible-api-gft.vercel.app/api/v1";
  const verseCheck = await axios.get(
    `${prodUrl}/chapters-verse-list?alias=${book}&chapter=${chapter}`
  );
  const versesCount = verseCheck.data.data.docs.chapters?.verses;
  
  start = start ?? "1";
  end = end ?? `${versesCount}`;
  console.log(start, end, versesCount < end);
  if (versesCount < +end) {
    return res.json({
      status: "fail",
      message: `Unexpected End - There Are Only ${versesCount} Verses On Chapter ${chapter}.`,
    });
  }

  for (let index = +start; index <= +end; index++) {
    promises.push(
      axios
        .get(
          `${prodUrl}/verse?book=${book}&chapter=${chapter}&verses=${index}`
        )
        .then((e) => {
          const data = e.data.data.docs;
          docArr.push({ verse: index, data,id:`${book}.${chapter}.${index}` });
        })
    );
  }

  await Promise.all(promises);

  docArr = docArr.sort((a, b) => a.verse - b.verse);

  redis.set(redisQueryName, JSON.stringify(docArr));

  return res
    .status(200)

    .json({
      status: "success",
      fromCache: false,
      data: { totalVerse: docArr.length, docs: docArr },
    });
});

export default router;
