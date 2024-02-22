import express, { Request, Response, Router } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import redis from "../../../cache";

// Router
const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const versions = require("../db/versions.json");
  const bookList = require("../db/books.json");
  const baseURL = "https://www.bible.com/bible";

  let book = req.query.book as string;
  const chapter = (req.query.chapter ??= "1");
  const verses = (req.query.verses ??= "1");
  let version = (req.query.version ??= "KJV");

  const redisQueryName = JSON.stringify({
    url: "/api/v1/verse",
    query: { verses, version, book, chapter },
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
  type bookType = {
    book: String;
    aliase: string;
    chapters: Number;
  };

  function apiError(code: number, message: string) {
    res.status(code).send({
      code: code,
      message: message,
    });
  }
  if (!book) return apiError(400, "Missing field 'book'");

  let versionFinder: any = {
    version: (Object.keys(versions)[
      Object.keys(versions).indexOf(
        version.toLocaleString().toLocaleUpperCase()
      )
    ] ??= "NIV"),
    id: (versions[version.toString().toLocaleUpperCase()] ??= 1),
  };

  let bookFinder =
    bookList.find(
      (o: bookType) => o.book.toLowerCase() === book.toLowerCase()
    ) || bookList.find((o: bookType) => o.aliase === book.toUpperCase());

  if (!bookFinder)
    return apiError(400, `Could not find book '${book}' by name or alias.`);

  let URL = `${baseURL}/${versionFinder.id}/${bookFinder.aliase}.${chapter}.${verses}`;

  console.log(URL, versionFinder.id);

  try {
    const { data } = await axios.get(URL);

    const $ = cheerio.load(data);

    const lastVerse = $(".ChapterContent_reader__UZc2K").eq(-1).text();
    if (lastVerse) return apiError(400, "Verse not found");
    if (chapter > bookFinder.chapters)
      return apiError(400, "Chapter not found.");

    const versesArray: Array<String> = [];
    const citationsArray: Array<String> = [];
    const wrapper = $(".text-19");
    const citationWrapper = $(".text-16");
    let unformattedVerse = "";
    await wrapper.each((i, p) => {
      unformattedVerse = $(p).eq(0).text();
      let formattedVerse = unformattedVerse.replace(/\n/g, " ");
      versesArray.push(formattedVerse);
    });

    await citationWrapper.each((i, p) => {
      let citation = $(p).eq(0).text();

      citationsArray.push(citation);
    });

    await redis.set(
      redisQueryName,
      JSON.stringify({
        citation: citationsArray[0],
        // passage: versesArray[0].split(".").map((e, index) => ({ index, e })),
        passage: versesArray[0],
        // unformattedVerse:unformattedVerse.split("\n").map((e, index) => ({ index, e })),
      })
    );

    return res.status(200).send({
      status: "success",
      fromCache: false,
      data: {
        docs: {
          citation: citationsArray[0],
          // passage: versesArray[0].split(".").map((e, index) => ({ index, e })),
          passage: versesArray[0],
        },
        // unformattedVerse:unformattedVerse.split("\n").map((e, index) => ({ index, e })),
      },
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
