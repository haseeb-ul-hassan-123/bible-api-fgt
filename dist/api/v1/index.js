"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cache_1 = __importDefault(require("../../cache"));
// Router
const router = express_1.default.Router();
const status = require("./status");
const verse = require("./verse/verse");
router.use("/status", status);
router.use("/verse", verse);
router.route("/versions").get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const redisQueryName = JSON.stringify({
        url: "/api/v1/versions",
        query: {},
    });
    const resp = yield cache_1.default.get(redisQueryName);
    if (resp) {
        const parsedResp = JSON.parse(resp);
        return res.json({
            status: "success",
            fromCache: true,
            data: { length: parsedResp.length, docs: parsedResp },
        });
    }
    const versions = require("./db/versions-list.json");
    yield cache_1.default.set(redisQueryName, JSON.stringify(versions));
    return res.status(200).json({
        status: "success",
        fromCache: false,
        data: { length: versions.length, docs: versions },
    });
}));
router.route("/books").get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const redisQueryName = JSON.stringify({
        url: "/api/v1/books",
        query: {},
    });
    const resp = yield cache_1.default.get(redisQueryName);
    if (resp) {
        const parsedResp = JSON.parse(resp);
        return res.json({
            status: "success",
            fromCache: true,
            data: { length: parsedResp.length, docs: parsedResp },
        });
    }
    const books = require("./db/books.json");
    yield cache_1.default.set(redisQueryName, JSON.stringify(books));
    return res.status(200).json({
        status: "success",
        fromCache: false,
        data: { length: books.length, docs: books },
    });
}));
router.route("/chapters-verse-list").get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { alias, chapter } = req.query;
        const redisQueryName = JSON.stringify({
            url: "chapters-verse-list",
            query: { alias, chapter },
        });
        const resp = yield cache_1.default.get(redisQueryName);
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
            const indexOf = verseList.findIndex((e) => e.alias === alias);
            if (indexOf != -1)
                verseList = verseList[indexOf];
            else
                res.status(400).json({ status: "fail", msg: `wrong alias: ${alias}` });
        }
        if (chapter) {
            const payload = {
                chapters: verseList.chapters[+chapter - 1],
                book: { name: verseList.book, abbr: verseList.abbr },
            };
            yield cache_1.default.set(redisQueryName, JSON.stringify(payload));
            return res.status(200).json({
                status: "success",
                fromCache: false,
                data: Object.assign({}, payload),
            });
        }
    }
    catch (error) {
        console.log("GOT ERROR");
        // res.json({status:'fail',message:"Something Very Bad :("})
    }
}));
router.get("/verse-with-index", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { start, end, book, chapter, version } = req.query;
    const redisQueryName = JSON.stringify({
        url: "/verse-with-index",
        query: { start, end, book, chapter, version },
    });
    const resp = yield cache_1.default.get(redisQueryName);
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
    let docArr = [];
    const baseUrl = true
        ? "http://localhost:4000/api/v1"
        : "http://ec2-3-80-86-162.compute-1.amazonaws.com/api/v1";
    try {
        const verseCheck = yield axios_1.default.get(`${baseUrl}/chapters-verse-list?alias=${book}&chapter=${chapter}`);
        const versesCount = (_b = (_a = verseCheck.data.data.docs) === null || _a === void 0 ? void 0 : _a.chapters.verses) !== null && _b !== void 0 ? _b : verseCheck.data.data.chapters.verses;
        console.log("🚀 :", versesCount);
        if (!versesCount)
            return res.json({ err: verseCheck.data });
        start = start !== null && start !== void 0 ? start : "1";
        end = end !== null && end !== void 0 ? end : `${versesCount}`;
        if (versesCount < +end) {
            return res.json({
                status: "fail",
                message: `Unexpected End - There Are Only ${versesCount} Verses On Chapter ${chapter}.`,
            });
        }
        for (let index = +start; index <= +end; index++) {
            promises.push(axios_1.default
                .get(`${baseUrl}/verse?book=${book}&chapter=${chapter}&verses=${index}&version=${version}`)
                .then((e) => {
                docArr.push({
                    verse: index,
                    data: e.data.data.docs,
                    id: `${book}.${chapter}.${index}`,
                });
            })
                .catch((e) => console.log("Got Error", e.data)));
        }
        yield Promise.all(promises).then((e) => { });
        docArr = docArr.sort((a, b) => a.verse - b.verse);
        cache_1.default.set(redisQueryName, JSON.stringify(docArr));
        return res
            .status(200)
            .json({
            status: "success",
            fromCache: false,
            data: { totalVerse: docArr.length, docs: docArr },
        });
    }
    catch (e) {
        console.log(`GOT ERROR`, start, end, book, chapter, version, e.response.data);
        res.json({ status: "fail", message: "Something Very Bad Happened :(" });
    }
}));
router.route("/clear-cache").get((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const isCleared = yield cache_1.default.flushall();
    res
        .status(200)
        .json({ status: "success", message: "Cache Cleared :)", isCleared });
}));
exports.default = router;
