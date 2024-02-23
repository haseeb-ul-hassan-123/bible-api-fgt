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
  try {
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
      else
        res.status(400).json({ status: "fail", msg: `wrong alias: ${alias}` });
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
  } catch (error) {
    console.log("GOT ERROR");
    // res.json({status:'fail',message:"Something Very Bad :("})
  }
});

router.get("/verse-with-index", async (req, res) => {
  let { start, end, book, chapter, version } = req.query;
  const redisQueryName = JSON.stringify({
    url: "/verse-with-index",
    query: { start, end, book, chapter, version },
  });

  const resp = await redis.get(redisQueryName);
  if (resp) {
    const parsedResp = JSON.parse(resp);
    return res.json({
      status: "success",
      fromCache: true,
      data: { totalVerse: parsedResp.length, docs: parsedResp },
    });
  }

  // if (!start || !end)
  //   return res.json({ status: "fail", message: "start or end is missing" });

  const promises = [];
  let docArr: Array<any> = [];

  const baseUrl = true
    ? "http://localhost:3000/api/v1"
    : "http://ec2-3-80-86-162.compute-1.amazonaws.com:3000/api/v1";

  try {
    const verseCheck = await axios.get(
      `${baseUrl}/chapters-verse-list?alias=${book}&chapter=${chapter}`
    );

    const versesCount =
      verseCheck.data.data.docs?.chapters.verses ??
      verseCheck.data.data.chapters.verses;

    console.log("🚀 :", versesCount);

    if (!versesCount) return res.json({ err: verseCheck.data });
    start = start ?? "1";
    end = end ?? `${versesCount}`;

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
            `${baseUrl}/verse?book=${book}&chapter=${chapter}&verses=${index}&version=${version}`
          )
          .then((e) => {
            docArr.push({
              verse: index,
              data: e.data.data.docs,
              id: `${book}.${chapter}.${index}`,
            });
          })
          .catch((e) => console.log("Got Error", e.data))
      );
    }

    await Promise.all(promises).then((e) => {});

    docArr = docArr.sort((a, b) => a.verse - b.verse);

    redis.set(redisQueryName, JSON.stringify(docArr));

    return res
      .status(200)

      .json({
        status: "success",
        fromCache: false,
        data: { totalVerse: docArr.length, docs: docArr },
      });
  } catch (e: any) {
    console.log(
      `GOT ERROR`,
      start,
      end,
      book,
      chapter,
      version,
      e.response.data
    );
    res.json({ status: "fail", message: "Something Very Bad Happened :(", e });
  }
});

router.route("/clear-cache").get(async (req, res) => {
  const isCleared = await redis.flushall();
  res
    .status(200)
    .json({ status: "success", message: "Cache Cleared :)", isCleared });
});

export default router;
