/**
 * Run this script to convert the project to TypeScript. This is only guaranteed to work
 * on the unmodified default template; if you have done code changes you are likely need
 * to touch up the generated project manually.
 */

// @ts-check
const fs = require('fs')
const path = require('path')
const { argv } = require('process')

const projectRoot = argv[2] || path.join(__dirname, '..')

function warn (message) {
  console.warn(`Warning: ${ message}`)
}

function createFile (fileName, contents) {
  if (fs.existsSync(fileName)) {
    warn(`Wanted to create ${fileName}, but it already existed. Leaving existing file.`)
  } else {
    fs.writeFileSync(fileName, contents)
  }
}

function replaceInFile (fileName, replacements) {
  if (fs.existsSync(fileName)) {
    let contents = fs.readFileSync(fileName, 'utf8')
    let hadUpdates = false

    replacements.forEach(([from, to]) => {
      const newContents = contents.replace(from, to)

      const isAlreadyApplied = typeof to !== 'string' || contents.includes(to)

      if (newContents !== contents) {
        contents = newContents
        hadUpdates = true
      } else if (!isAlreadyApplied) {
        warn(`Wanted to update "${from}" in ${fileName}, but did not find it.`)
      }
    })

    if (hadUpdates) {
      fs.writeFileSync(fileName, contents)
    } else {
      console.log(`${fileName} had already been updated.`)
    }
  } else {
    warn(`Wanted to update ${fileName} but the file did not exist.`)
  }
}

// Add deps to pkg.json
function addDepsToPackageJson () {
  const pkgJSONPath = path.join(projectRoot, 'package.json')
  const packageJSON = JSON.parse(fs.readFileSync(pkgJSONPath, 'utf8'))

  packageJSON.devDependencies = Object.assign(packageJSON.devDependencies, {
    'ts-loader': '^8.0.4',
    '@tsconfig/svelte': '^1.0.10',
    '@types/node': '^14.11.1',
    'svelte-check': '^1.0.46',
    'svelte-preprocess': '^4.3.0',
    tslib: '^2.0.1',
    typescript: '^4.0.3',
  })

  // Add script for checking
  packageJSON.scripts = Object.assign(packageJSON.scripts, {
    validate: 'svelte-check',
  })

  // Write the package JSON
  fs.writeFileSync(pkgJSONPath, JSON.stringify(packageJSON, null, '  '))
}

// mv src/main.js to main.ts - note, we need to edit rollup.config.js for this too
function changeJsExtensionToTs (dir) {
  const elements = fs.readdirSync(dir, { withFileTypes: true })

  for (let i = 0; i < elements.length; i++) {
    if (elements[i].isDirectory()) {
      changeJsExtensionToTs(path.join(dir, elements[i].name))
    } else if (elements[i].name.match(/^[^_]((?!json).)*js$/)) {
      fs.renameSync(path.join(dir, elements[i].name), path.join(dir, elements[i].name).replace('.js', '.ts'))
    }
  }
}

function updateSingleSvelteFile ({ view, vars, contextModule }) {
  replaceInFile(path.join(projectRoot, 'src', `${view}.svelte`), [
    [/(?:<script)(( .*?)*?)>/gm, (m, attrs) => `<script${attrs}${!attrs.includes('lang="ts"') ? ' lang="ts"' : ''}>`],
    ...(vars ? vars.map(({ name, type }) => [`export let ${name};`, `export let ${name}: ${type};`]) : []),
    ...(contextModule ? contextModule.map(({ js, ts }) => [js, ts]) : []),
  ])
}

// Switch the App.svelte file to use TS
function updateSvelteFiles () {
  [
    {
      view: 'App',
      vars: [{ name: 'name', type: 'string' }],
    },
  ].forEach(updateSingleSvelteFile)
}

function updateWebpackConfig () {
  // Edit webpack config
  replaceInFile(path.join(projectRoot, 'webpack.config.js'), [
    // Edit imports
    [
      /require\('path'\);\n(?!const sveltePreprocess)/,
			`require('path');\nconst sveltePreprocess = require('svelte-preprocess');\n`,
    ],
    // Edit extensions
    [
      /'\.js',/,
			`'.js', '.ts',`,
    ],
    // Edit name of entry point
    [
      /'\.\/src\/main.js'/,
			`'./src/main.ts'`,
    ],
    // Add preprocess to the svelte loader, this is tricky because there's no easy signifier.
    // Instead we look for 'hotReload: 'prod,'
    [
      /hotReload: \!prod(?!,\n\s*preprocess)/g,
      'hotReload: !prod,\n\t\t\t\t\t\t\tpreprocess: sveltePreprocess({ sourceMap: !prod })',
    ],
    // Add ts-loader
    [
      /module: {\n\s*rules: \[\n\s*(?!{\n\s*test: \/\\\.ts\$\/)/g,
			`module: {\n\t\t\trules: [\n\t\t\t\t{\n\t\t\t\t\ttest: /\\.ts$/,\n\t\t\t\t\tloader: 'ts-loader',\n\t\t\t\t\texclude: /node_modules/\n\t\t\t\t},\n\t\t\t\t`,
    ],
  ])
}

// Add TSConfig
function createTsConfig () {
  const tsconfig = `{
		"extends": "@tsconfig/svelte/tsconfig.json",
		"include": ["src/**/*", "src/node_modules/**/*"],
		"exclude": ["node_modules/*", "__sapper__/*", "static/*"]
	}`

  createFile(path.join(projectRoot, 'tsconfig.json'), tsconfig)
}

// Adds the extension recommendation
function configureVsCode () {
  const dir = path.join(projectRoot, '.vscode')

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  createFile(path.join(projectRoot, '.vscode', 'extensions.json'), `{"recommendations": ["svelte.svelte-vscode"]}`)
}

function deleteThisScript () {
  fs.unlinkSync(path.join(__filename))

  // Check for Mac's DS_store file, and if it's the only one left remove it
  const remainingFiles = fs.readdirSync(path.join(__dirname))

  if (remainingFiles.length === 1 && remainingFiles[0] === '.DS_store') {
    fs.unlinkSync(path.join(__dirname, '.DS_store'))
  }

  // Check if the scripts folder is empty
  if (fs.readdirSync(path.join(__dirname)).length === 0) {
    // Remove the scripts folder
    try {
      fs.rmdirSync(path.join(__dirname))
    } catch (e) {
      warn(`Cannot delete locked directory ${__dirname}`)
    }
  }
}

console.log(`Adding TypeScript...`)

addDepsToPackageJson()

changeJsExtensionToTs(path.join(projectRoot, 'src'))

updateSvelteFiles()

updateWebpackConfig()

createTsConfig()

configureVsCode()

// Delete this script, but not during testing
if (!argv[2]) {
  deleteThisScript()
}

console.log('Converted to TypeScript.')

if (fs.existsSync(path.join(projectRoot, 'node_modules'))) {
  console.log(`
Next:
1. run 'npm install' again to install TypeScript dependencies
`)
}
