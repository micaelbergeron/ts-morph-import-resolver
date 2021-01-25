"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("/lib");
// import one from '~lib/shared/one'
const one_1 = require("lib@shared/one");
console.log(lib_1.default());
if (one_1.default() != 1)
    throw "Error";
console.log("Success!");
//# sourceMappingURL=index.js.map