"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Router
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.sendStatus(200);
});
module.exports = router;
