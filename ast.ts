import * as ts from 'typescript'
const path = require('path')

const base_dir = path.resolve(process.cwd(), '../../');
console.log(__dirname)

function absolute(p: string): string {
  return '/' + path.relative(
    base_dir,
    p
  )
}

const printer = ts.createPrinter()
const file = ts.updateSourceFileNode(
  ts.createSourceFile('temporary.ts', '', ts.ScriptTarget.Latest),
  [
    ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(ts.createIdentifier('a'), undefined),
      ts.createStringLiteral(absolute('../../test'))
    )
  ]
)

printer.printFile(file)
console.log(printer.printFile(file))
