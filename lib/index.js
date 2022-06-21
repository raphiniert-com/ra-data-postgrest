"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authProvider = void 0;
var dataProvider_1 = __importDefault(require("./dataProvider"));
var authProvider_1 = __importDefault(require("./authProvider"));
exports.authProvider = authProvider_1.default;
exports.default = dataProvider_1.default;
