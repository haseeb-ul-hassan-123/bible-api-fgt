"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Router
const router = express_1.default.Router();
// Api versions
const index_1 = __importDefault(require("./v1/index"));
// Directing versions
router.use('/v1', index_1.default);
exports.default = router;
