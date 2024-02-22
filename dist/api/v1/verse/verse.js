"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const cheerio = __importStar(require("cheerio"));
const cache_1 = __importDefault(require("../../../cache"));
// Router
const router = express_1.default.Router();
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    var _f, _g, _h, _j, _k, _l;
    const versions = require("../db/versions.json");
    const bookList = require("../db/books.json");
    const baseURL = "https://www.bible.com/bible";
    let book = req.query.book;
    const chapter = ((_a = (_f = req.query).chapter) !== null && _a !== void 0 ? _a : (_f.chapter = "1"));
    const verses = ((_b = (_g = req.query).verses) !== null && _b !== void 0 ? _b : (_g.verses = "1"));
    let version = ((_c = (_h = req.query).version) !== null && _c !== void 0 ? _c : (_h.version = "KJV"));
    const redisQueryName = JSON.stringify({
        url: "/api/v1/verse",
        query: { verses, version, book, chapter },
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
    function apiError(code, message) {
        res.status(code).send({
            code: code,
            message: message,
        });
    }
    if (!book)
        return apiError(400, "Missing field 'book'");
    let versionFinder = {
        version: ((_d = (_j = Object.keys(versions))[_k = Object.keys(versions).indexOf(version.toLocaleString().toLocaleUpperCase())]) !== null && _d !== void 0 ? _d : (_j[_k] = "NIV")),
        id: ((_e = versions[_l = version.toString().toLocaleUpperCase()]) !== null && _e !== void 0 ? _e : (versions[_l] = 1)),
    };
    let bookFinder = bookList.find((o) => o.book.toLowerCase() === book.toLowerCase()) || bookList.find((o) => o.aliase === book.toUpperCase());
    if (!bookFinder)
        return apiError(400, `Could not find book '${book}' by name or alias.`);
    let URL = `${baseURL}/${versionFinder.id}/${bookFinder.aliase}.${chapter}.${verses}`;
    console.log(URL, versionFinder.id);
    try {
        const { data } = yield axios_1.default.get(URL);
        const $ = cheerio.load(data);
        const lastVerse = $(".ChapterContent_reader__UZc2K").eq(-1).text();
        if (lastVerse)
            return apiError(400, "Verse not found");
        if (chapter > bookFinder.chapters)
            return apiError(400, "Chapter not found.");
        const versesArray = [];
        const citationsArray = [];
        const wrapper = $(".text-19");
        const citationWrapper = $(".text-16");
        let unformattedVerse = "";
        yield wrapper.each((i, p) => {
            unformattedVerse = $(p).eq(0).text();
            let formattedVerse = unformattedVerse.replace(/\n/g, " ");
            versesArray.push(formattedVerse);
        });
        yield citationWrapper.each((i, p) => {
            let citation = $(p).eq(0).text();
            citationsArray.push(citation);
        });
        yield cache_1.default.set(redisQueryName, JSON.stringify({
            citation: citationsArray[0],
            // passage: versesArray[0].split(".").map((e, index) => ({ index, e })),
            passage: versesArray[0],
            // unformattedVerse:unformattedVerse.split("\n").map((e, index) => ({ index, e })),
        }));
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
    }
    catch (err) {
        console.error(err);
    }
}));
module.exports = router;
