require('../spec_helper')

const path = require('path')
const Promise = require('bluebird')
const fixture = require(`../../lib/fixture`)
const { fs } = require(`../../lib/util/fs`)
const FixturesHelper = require('@tooling/system-tests')
const { getCtx } = require(`../../lib/makeDataContext`)

let ctx

describe('lib/fixture', () => {
  beforeEach(async function () {
    ctx = getCtx()
    FixturesHelper.scaffold()

    this.todosPath = FixturesHelper.projectPath('todos')
    this.read = (folder, image, encoding) => {
      return fs.readFileAsync(path.join(folder, image), encoding)
    }

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)

    return ctx.lifecycleManager.getFullInitialConfig()
    .then((cfg) => {
      ({ fixturesFolder: this.fixturesFolder } = cfg)
    })
  })

  afterEach(() => {
    return FixturesHelper.remove()
  })

  context('file not found', () => {
    it('throws when file cannot be found', function () {
      const p = 'does-not-exist.json'

      return fixture.get(this.fixturesFolder, p)
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).to.include('A fixture file could not be found')

        expect(err.message).to.include(p)
      })
    })
  })

  context('unicode escape syntax', () => {
    it('can parse unicode escape in JSON', function () {
      return fixture.get(this.fixturesFolder, 'unicode_escape.json').then((obj) => {
        expect(obj).to.deep.eq({
          name: '\u2665',
        })
      })
    })
  })

  context('nested fixtures', () => {
    it('can pass path to nested fixture', function () {
      return fixture.get(this.fixturesFolder, 'nested/fixture.js').then((obj) => {
        expect(obj).to.deep.eq({
          nested: 'fixture',
        })
      })
    })
  })

  context('json files', () => {
    it('throws when json is invalid', function () {
      const e =
        `\'bad_json.json\' is not valid JSON.\nExpected ',' or '}' after property value in JSON at position 20 while parsing near "{\\n  \\"bad\\": \\"json\\"\\n  \\"should\\": \\"not parse..."`

      return fixture.get(this.fixturesFolder, 'bad_json.json')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).to.eq(e)
      })
    })

    it('does not reformat json on parse error', function () {
      return fixture.get(this.fixturesFolder, 'bad_json.json')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        // ensure the bad_json file was kept as before
        return fs.readFileAsync(`${this.fixturesFolder}/bad_json.json`, 'utf8').then((str) => {
          expect(str).to.eq(`\
{
  "bad": "json"
  "should": "not parse"
}\
`)
        })
      })
    })

    it('does not reformat json or write fixture file', function () {
      return fixture.get(this.fixturesFolder, 'no_format.json').then((obj) => {
        return fs.readFileAsync(`${this.fixturesFolder}/no_format.json`, 'utf8').then((json) => {
          expect(json).to.eq('{"id": 1, "name": "brian"}')
        })
      })
    })

    it('does not remove string whitespace', function () {
      return fixture.get(this.fixturesFolder, 'words.json').then((obj) => {
        return fs.readFileAsync(`${this.fixturesFolder}/words.json`, 'utf8').then((json) => {
          expect(json).to.eq(`\
{
  "some": "multiple space separate words",
  "that": "should keep their spaces"
}\
`)
        })
      })
    })

    it('parses json to valid JS object', function () {
      return fixture.get(this.fixturesFolder, 'users.json').then((users) => {
        expect(users).to.deep.eq([
          {
            id: 1,
            name: 'brian',
          }, {
            id: 2,
            name: 'jennifer',
          },
        ])
      })
    })

    it('does not reformat empty objects', function () {
      // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23457
      this.retries(15)

      const fn = () => {
        return fixture.get(this.fixturesFolder, 'empty_objects')
      }

      return Promise.map(Array(500), fn, { concurrency: 5 }).then(() => {
        return fs.readFileAsync(`${this.fixturesFolder}/empty_objects.json`, 'utf8').then((str) => {
          expect(str).to.eq(`\
{
  "empty": {
    "object": {},
    "array": [],
    "object2": {\n\n    },
    "array2": [\n\n    ]
  }
}\
`)
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/3739
    it('can load a fixture with no extension when a same-named folder also exists', async () => {
      const projectPath = FixturesHelper.projectPath('folder-same-as-fixture')

      await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(projectPath)

      return ctx.lifecycleManager.getFullInitialConfig()
      .then((cfg) => {
        return fixture.get(cfg.fixturesFolder, 'foo')
        .then((result) => {
          expect(result).to.deep.eq({ 'bar': 'baz' })
        })
      })
    })
  })

  context('js files', () => {
    it('returns valid JS object', function () {
      return fixture.get(this.fixturesFolder, 'user.js').then((user) => {
        expect(user).to.deep.eq({
          id: 1,
          name: 'brian',
          age: 29,
          posts: [],
        })
      })
    })

    it('does not rewrite file as a formated valid JS object', function () {
      return fixture.get(this.fixturesFolder, 'no_format.js').then((obj) => {
        return fs.readFileAsync(`${this.fixturesFolder}/no_format.js`, 'utf8').then((str) => {
          expect(str).to.eq('{foo: "bar", baz: "quux"}')
        })
      })
    })

    it('throws on a bad JS object', function () {
      const e =
        `\
bad_js.js:3
  bar: "bar
       ^
ParseError: Unterminated string constant\
`

      return fixture.get(this.fixturesFolder, 'bad_js.js')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).to.eq(`'bad_js.js' is not a valid JavaScript object.\n\n${e}`)
      })
    })
  })

  context('coffee files', () => {
    it('returns valid coffee object', function () {
      return fixture.get(this.fixturesFolder, 'valid_coffee_obj.coffee').then((coffeeObj) => {
        expect(coffeeObj).to.deep.eq({
          name: 'cypress',
          users: [],
        })
      })
    })

    it('does not rewrite coffee files', function () {
      return fixture.get(this.fixturesFolder, 'no_format_coffee.coffee').then(() => {
        return fs.readFileAsync(`${this.fixturesFolder}/no_format_coffee.coffee`, 'utf8').then((str) => {
          expect(str).to.eq(`\
[
  {id: 1}
  {id: 2}
]\
`)
        })
      })
    })

    it('throws on bad coffee object', function () {
      return fixture.get(this.fixturesFolder, 'bad_coffee.coffee')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).to.eq(`\
'bad_coffee.coffee is not a valid CoffeeScript object.
[stdin]:1:1: error: missing }
{
^\
`)
      })
    })
  })

  context('html files', () => {
    it('returns html as a string', function () {
      return fixture.get(this.fixturesFolder, 'index.html').then((index) => {
        expect(index).to.eq(`\
<!doctype html>
<html>
<head>
<title>index.html</title>
</head>
<body>
index
</body>
</html>\
`)
      })
    })

    it('does not rewrite file as formatted html', function () {
      return fixture.get(this.fixturesFolder, 'index.html').then(() => {
        return fs.readFileAsync(`${this.fixturesFolder}/index.html`, 'utf8').then((str) => {
          expect(str).to.eq(`\
<!doctype html>
<html>
<head>
<title>index.html</title>
</head>
<body>
index
</body>
</html>\
`)
        })
      })
    })
  })

  context('txt files', () => {
    it('returns text as string', function () {
      return fixture.get(this.fixturesFolder, 'message.txt').then((index) => {
        expect(index).to.eq('foobarbaz')
      })
    })
  })

  context('csv files', () => {
    it('returns text as string', function () {
      return fixture.get(this.fixturesFolder, 'data.csv').then((index) => {
        expect(index).to.eq(`\
Name,Occupation,Birth Year
Jane,Engineer,1976
John,Chef,1982
\
`)
      })
    })
  })

  context('file with unknown extension', () => {
    it('returns text as string', function () {
      return fixture.get(this.fixturesFolder, 'unknown_ext.yaml').then((index) => {
        expect(index).to.eq(`\
- foo
- bar
- 
\
`)
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/1558
  context('binary files', () => {
    it('returns file as buffer regardless of extension when passed null encoding', function () {
      return fixture.get(this.fixturesFolder, 'nested/fixture.js', { encoding: null }).then((index) => {
        expect(index).to.eql(Buffer.from('{nested: "fixture"}'))
      })
    })
  })

  context('file with unknown extension and encoding specified', () => {
    it('returns text encoded as specified', function () {
      return fixture.get(this.fixturesFolder, 'ascii.foo', { encoding: 'ascii' }).then((index) => {
        expect(index).to.eq('o#?\n')
      })
    })
  })

  context('image files', () => {
    it('returns png as buffer', function () {
      return this.read(this.fixturesFolder, 'images/flower.png')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'images/flower.png')
        .then((result) => {
          expect(result).to.eql(file)
        })
      })
    })

    it('returns jpg as buffer', function () {
      return this.read(this.fixturesFolder, 'images/sample.jpg')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'images/sample.jpg')
        .then((result) => {
          expect(result).to.eql(file)
        })
      })
    })

    it('returns gif as buffer', function () {
      return this.read(this.fixturesFolder, 'images/word.gif')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'images/word.gif')
        .then((result) => {
          expect(result).to.eql(file)
        })
      })
    })

    it('returns tif as buffer', function () {
      return this.read(this.fixturesFolder, 'images/sample.tif')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'images/sample.tif')
        .then((result) => {
          expect(result).to.eql(file)
        })
      })
    })

    it('returns png as binary if that encoding is requested', function () {
      return this.read(this.fixturesFolder, 'images/flower.png', 'binary')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'images/flower.png', { encoding: 'binary' })
        .then((result) => {
          expect(result).to.eq(file)
        })
      })
    })
  })

  context('zip files', () => {
    it('returns zip as buffer', function () {
      return this.read(this.fixturesFolder, 'example.zip')
      .then((file) => {
        return fixture.get(this.fixturesFolder, 'example.zip').then((result) => {
          expect(result).to.eql(file)
        })
      })
    })
  })

  context('extension omitted', () => {
    it('#1 finds json', function () {
      return fixture.get(this.fixturesFolder, 'foo').then((obj) => {
        expect(obj).to.deep.eq([
          { json: true },
        ])
      })
    })

    it('#2 finds js', function () {
      return fixture.get(this.fixturesFolder, 'bar').then((obj) => {
        expect(obj).to.deep.eq({ js: true })
      })
    })

    it('throws when no file by any extension can be found', function () {
      return fixture.get(this.fixturesFolder, 'does-not-exist')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).to.include('A fixture file could not be found')
        expect(err.message).to.include('/does-not-exist')
      })
    })
  })

  context('new lines', () => {
    it('does not remove trailing new lines on .txt', function () {
      return fixture.get(this.fixturesFolder, 'trailing_new_line.txt').then((str) => {
        return fs.readFileAsync(`${this.fixturesFolder}/trailing_new_line.txt`, 'utf8').then((str2) => {
          expect(str2).to.eq('foo\nbar\nbaz\n')
        })
      })
    })

    it('does not remove trailing new lines on .json', function () {
      return fixture.get(this.fixturesFolder, 'trailing_new_line.json').then((str) => {
        return fs.readFileAsync(`${this.fixturesFolder}/trailing_new_line.json`, 'utf8').then((str2) => {
          expect(str2).to.eq('{"foo": "bar"}\n')
        })
      })
    })

    it('does not remove trailing new lines on .js', function () {
      return fixture.get(this.fixturesFolder, 'trailing_new_line.js').then((str) => {
        return fs.readFileAsync(`${this.fixturesFolder}/trailing_new_line.js`, 'utf8').then((str2) => {
          expect(str2).to.eq('{foo: "bar"}\n')
        })
      })
    })

    it('does not remove trailing new lines on .coffee', function () {
      return fixture.get(this.fixturesFolder, 'trailing_new_line_coffee.coffee').then((str) => {
        return fs.readFileAsync(`${this.fixturesFolder}/trailing_new_line_coffee.coffee`, 'utf8').then((str2) => {
          expect(str2).to.eq('{ foo: "bar" }\n')
        })
      })
    })

    it('does not remove trailing new lines on .html', function () {
      return fixture.get(this.fixturesFolder, 'trailing_new_line.html').then((str) => {
        return fs.readFileAsync(`${this.fixturesFolder}/trailing_new_line.html`, 'utf8').then((str2) => {
          expect(str2).to.eq('<html><body>foo</body></html>\n')
        })
      })
    })
  })
})
