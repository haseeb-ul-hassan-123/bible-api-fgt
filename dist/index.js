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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_extended_1 = __importDefault(require("dotenv-extended"));
const index_1 = __importDefault(require("./api/index"));
const axios_1 = __importDefault(require("axios"));
dotenv_extended_1.default.load();
const app = (0, express_1.default)();
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000;
app.use(express_1.default.json());
app.use("/api", index_1.default);
app.get("/", (req, res) => {
    return res.status(200).json({ body: req.body, status: "Trueee...." });
});
app.get("/api/v1/ping", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { start, end, book, chapter } = req.query;
    if (!start || !end)
        return res.json({ status: "fail", message: "start or end is missing" });
    const promises = [];
    let arr = [];
    const verseCheck = yield axios_1.default.get(`https://bible-api-gft.vercel.app/api/v1/chapters-verse-list?abbr=${book}&chapter=${chapter}`);
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
        promises.push(axios_1.default
            .get(`https://bible-api-2i2u63a2n-syedammad0.vercel.app/api/v1/verse?book=${book}&chapter=${chapter}&verses=${index}`)
            .then((e) => {
            arr.push({ verse: index, data: e.data.data });
        }));
    }
    yield Promise.all(promises);
    return res.status(200).json({ arr: arr.sort((a, b) => a.verse - b.verse) });
}));
app.listen(port, () => {
    console.log(`⚡️[Server]: Server is running at http://localhost:${port}`);
});
exports.default = app;
