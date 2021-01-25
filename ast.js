"use strict";
exports.__esModule = true;
var ts = require("typescript");
var path = require('path');
var base_dir = path.relative(process.cwd(), __dirname);
var printer = ts.createPrinter();
var file = ts.updateSourceFileNode(ts.createSourceFile('temporary.ts', '', ts.ScriptTarget.Latest), [
    ts.createImportDeclaration(undefined, undefined, ts.createImportClause(ts.createIdentifier('a'), undefined), ts.createStringLiteral('../../test'))
]);
console.log(base_dir);
printer.printFile(file);
console.log(printer.printFile(file));
