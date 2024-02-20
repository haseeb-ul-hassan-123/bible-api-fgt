import express, { Router } from "express";

// Router
const router: Router = express.Router();

const status = require("./status");
const verse = require("./verse/verse");

router.use("/status", status);
router.use("/verse", verse);

router.route("/versions").get((req, res) => {
  const versions = require("./db/versions-list.json");
  res.json(versions);
});

router.route("/books").get((req, res) => {
  const books = require("./db/books.json");
  res.json({ books });
});

router.route("/chapters-verse-list").get((req, res) => {
  const { abbr, chapter } = req.query;

  let verseList = require("./db/chapters-verse-list.json");

  const data = {};

  if (abbr) {
    const indexOf = verseList.findIndex((e: any) => e.abbr === abbr);
    if (indexOf == -1)
      return res
        .status(400)
        .json({ status: "fail", msg: `wrong abbr: ${abbr}` });
    verseList = verseList[indexOf];
  }

  if (chapter) {
    const index = +chapter - 1;
    return res.json({
      data: {
        chapters: verseList.chapters[index],
        book: { name: verseList.book, abbr: verseList.abbr },
      },
    });
  }

  res.json({ verseList });
});

export default router;
