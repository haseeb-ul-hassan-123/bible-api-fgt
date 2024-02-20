"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Router
const router = express_1.default.Router();
const status = require("./status");
const verse = require("./verse/verse");
router.use("/status", status);
router.use("/verse", verse);
router.route("/versions").get((req, res) => {
    const versions = require("./db/versions-list.json");
    res.status(200).json({ success: true, data: versions });
});
router.route("/books").get((req, res) => {
    const books = require("./db/books.json");
    res.status(200).json({
        success: true,
        data: books,
    });
});
router.route("/chapters-verse-list").get((req, res) => {
    const { abbr, chapter } = req.query;
    let verseList = require("./db/chapters-verse-list.json");
    if (abbr) {
        const indexOf = verseList.findIndex((e) => e.abbr === abbr);
        if (indexOf != -1)
            verseList = verseList[indexOf];
        else
            res.status(400).json({ status: "fail", msg: `wrong abbr: ${abbr}` });
    }
    if (chapter) {
        return res.json({
            status: "success",
            data: {
                chapters: verseList.chapters[+chapter - 1],
                book: { name: verseList.book, abbr: verseList.abbr },
            },
        });
    }
});
exports.default = router;
