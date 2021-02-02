import { Project, Node, ExportDeclaration, ImportDeclaration, SourceFile } from 'ts-morph'
import * as ts from 'typescript'
import * as path from 'path'

const FLAGS = {
  save: process.argv.includes("--save"),
  info: process.argv.includes("--info"),
  debug: process.argv.includes("--debug"),
}

// const rootDir = process.cwd();
const rootDir = path.resolve(process.cwd(), process.argv[2] || "")

// this should come from "tsconfig"
const compilerOptions = {
  baseDir: "./src/",
  paths: {
    "~/*": "*"
  }
}

const ROOT_MODULES = '^(app|common|ui|api|mural|icons|amp|models|helpers|services)'

var count = 0;
main()

// returns the first aliased module path that matches
function aliasPath(p: string): string {
  const alias = "~/" // find this with a glob match

  return  alias + path.relative(
    compilerOptions.baseDir,
    p
  )
}

export function main() {
  const filesPattern = path.join('**', compilerOptions.baseDir, '**/*.ts?(x)')
  console.log(`Running on ${rootDir}`);
  console.log(`${filesPattern}`);

  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    // useVirtualFileSystem: true,
    compilerOptions: { target: ts.ScriptTarget.ES2018 }
  })

  project.getSourceFiles(filesPattern).forEach((sourceFile) => {
    const modified = applyNoSearch(sourceFile)
    FLAGS.debug && console.log(sourceFile.getFilePath(), count)

    if (FLAGS.save && modified) {
      // sourceFile.organizeImports();

      process.stdout.write("f")
      sourceFile.save()
    }

    // we might need this file path, but nothing else from it now
    sourceFile.forget()
  })
}

function nodeHasRelativeModuleSpecifier(node: ImportDeclaration | ExportDeclaration): boolean {
  if (Node.isExportDeclaration(node) && !node.hasModuleSpecifier()) {
    return false;
  }

  return (
    node.isModuleSpecifierRelative() ||
    !!node.getModuleSpecifierValue()?.match(ROOT_MODULES)
  )
}

function transformNode(node: ImportDeclaration | ExportDeclaration): boolean {
  if (!nodeHasRelativeModuleSpecifier(node)) {
    node.forget();
    return false;
  }

  const sourceFile = node.getSourceFile()
  // this node need to change now, let's figure out where we are on the
  // file system and adapt the import path accordingly
  const alias = "~/" // find this with a glob match

  const computedPaths = {
    sourceFilePath: sourceFile.getFilePath(),
    moduleSpecifier: node.getModuleSpecifierValue() as string,
    rootRelative: path.relative(
      path.resolve(rootDir, compilerOptions.baseDir),
      path.resolve(sourceFile.getDirectoryPath(), node.getModuleSpecifierValue() as string),
    ),
  }

  const parentRelative = '\\.\\./';
  const relative = '^\\./'

  if (computedPaths.moduleSpecifier.match(parentRelative)) {
    // we need to resolve this according to the alias declaration
    computedPaths.moduleSpecifier = alias + computedPaths.rootRelative
  } else if (!computedPaths.moduleSpecifier.match(relative)) {
    computedPaths.moduleSpecifier = alias + computedPaths.moduleSpecifier
  }

  FLAGS.debug && console.debug(`computedPaths: ${JSON.stringify(computedPaths, null, 2)}`);

  count++; // import is valid

  node.set({ moduleSpecifier: computedPaths.moduleSpecifier })
  node.forget()
  return true;
}

function applyNoSearch(sourceFile: SourceFile) {
  let modified = false

  for (let node of sourceFile.getImportDeclarations()) {
    const transformed = transformNode(node)
    process.stdout.write(transformed ? 'i' : '.')

    modified ||= transformed
  };

  for (let node of sourceFile.getExportDeclarations()) {
    const transformed = transformNode(node)
    process.stdout.write(transformed ? 'e' : '.')

    modified ||= transformed
  }

  return modified
}

function apply(sourceFile: SourceFile) {
  let modified = false
  const imports = sourceFile.getImportDeclarations();

  const nodesToFix = []
  for (var node of imports) {
    let importNode: ImportDeclaration = (node as ImportDeclaration)

    if (!importNode.isModuleSpecifierRelative()) continue;

    const importedSourceFile = importNode.getModuleSpecifierSourceFile();
    if (!importedSourceFile) continue;

    // this node need to change now, let's figure out where we are on the
    // file system and adapt the import path accordingly
    const alias = "~/" // find this with a glob match

    const computedPaths = {
      rootRelative: path.relative(
        path.resolve(rootDir, compilerOptions.baseDir),
        sourceFile.getFilePath(),
      ),
      sourceFilePath: sourceFile.getFilePath(),
      importFilePath: importedSourceFile.getFilePath(),
    }

    FLAGS.debug && console.debug(`computedPaths: ${JSON.stringify(computedPaths)}`);

    let moduleSpecifier = sourceFile.getRelativePathAsModuleSpecifierTo(
      computedPaths.importFilePath as string
    );

    FLAGS.debug && console.log(`relativeModule: ${moduleSpecifier}`)
    if (!moduleSpecifier.startsWith("./")) {
      // we need to resolve this according to the alias declaration
      moduleSpecifier = alias + path.relative(
        rootDir,
        computedPaths.importFilePath,
      )
    }

    modified = true
    count++; // import is valid
    nodesToFix.push({ importNode, moduleSpecifier })
  };

  for (const { importNode, moduleSpecifier } of nodesToFix) {
    importNode.set({ moduleSpecifier })
    importNode.forget()
  }

  return modified
}
