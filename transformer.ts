import { Project, ImportDeclaration, SourceFile } from 'ts-morph'
import * as ts from 'typescript'
const path = require('path')

//const INPUT = process.argv[2];
const rootDir = process.cwd();

// this should come from "tsconfig"
const compilerOptions = {
  baseDir: ".",
  paths: {
    "~/*": "*"
  }
}

//console.log(`Running on ${INPUT}`);
console.log(main());


// returns the first aliased module path that matches
function aliasPath(p: string): string {
  const alias = "~/" // find this with a glob match

  return  alias + path.relative(
    compilerOptions.baseDir,
    p
  )
}

export function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    // useVirtualFileSystem: true,
    compilerOptions: { target: ts.ScriptTarget.ES2018 }
  })

  /* project.addSourceFilesFromTsConfig('./tsconfig.json');
   * const sourceFile = project.getSourceFile(INPUT)
   * if (!sourceFile) process.exit(-1)
   */

  // run this on all the files
  project.getSourceFiles().map((sourceFile) => {
    apply(sourceFile)
    console.log(sourceFile.getText())
  })

  //sourceFile.save()
}

function apply(sourceFile: SourceFile) {
  const imports = sourceFile.getImportDeclarations();

  for (var node of imports) {
    let importNode: ImportDeclaration = (node as ImportDeclaration)
    //console.log(node)

    if (!importNode.isModuleSpecifierRelative()) continue;

    // this node need to change now, let's figure out where we are on the
    // file system and adapt the import path accordingly
    const alias = "~/" // find this with a glob match

    const computedPaths = {
      rootRelative: path.relative(
        rootDir,
        sourceFile.getFilePath(),
      ),
      sourceFilePath: sourceFile.getFilePath(),
      importFilePath: importNode.getModuleSpecifierSourceFile()?.getFilePath(),
    }

    console.debug(`computedPaths: ${JSON.stringify(computedPaths)}`);

    const relativeModule = sourceFile.getRelativePathAsModuleSpecifierTo(
      computedPaths.importFilePath as string
    );
    console.log(`relativeModule: ${relativeModule}`)

    if (!relativeModule.startsWith("./")) {
      // we need to resolve this according to the alias declaration

      const aliasedPath = alias + path.relative(
        rootDir,
        computedPaths.importFilePath,
      )

      importNode.setModuleSpecifier(aliasedPath)
    } else {
      importNode.setModuleSpecifier(relativeModule)
    }
  };
}
