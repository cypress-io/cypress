import path from 'path'
import Bluebird from 'bluebird'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import * as fixture from '../../lib/fixture'
import { fs } from '../../lib/util/fs'
import FixturesHelper from '@tooling/system-tests'
import { setCtx, makeDataContext, clearCtx } from '../../lib/makeDataContext'
import { getCtx } from '@packages/data-context'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. Config resolution never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

let ctx

describe('lib/fixture', () => {
  let todosPath: string
  let fixturesFolder: string

  const read = (folder, image, encoding?) => {
    return fs.readFileAsync(path.join(folder, image), encoding)
  }

  beforeAll(async () => {
    // Clear and set up DataContext
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
    ctx = getCtx()

    FixturesHelper.scaffold()

    todosPath = FixturesHelper.projectPath('todos')

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(todosPath)

    vi.spyOn(ctx.browser, 'machineBrowsers').mockResolvedValue([
      {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        majorVersion: '123',
        name: 'electron',
        path: 'path-to-browser-one',
        version: '123.45.67',
      },
    ])

    const cfg = await ctx.lifecycleManager.getFullInitialConfig()

    fixturesFolder = cfg.fixturesFolder
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await clearCtx()

    return FixturesHelper.remove()
  })

  describe('file not found', () => {
    it('throws when file cannot be found', () => {
      const p = 'does-not-exist.json'

      return fixture.get(fixturesFolder, p)
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).toContain('A fixture file could not be found')

        expect(err.message).toContain(p)
      })
    })
  })

  describe('unicode escape syntax', () => {
    it('can parse unicode escape in JSON', () => {
      return fixture.get(fixturesFolder, 'unicode_escape.json').then((obj) => {
        expect(obj).toStrictEqual({
          name: '\u2665',
        })
      })
    })
  })

  describe('nested fixtures', () => {
    it('can pass path to nested fixture', () => {
      return fixture.get(fixturesFolder, 'nested/fixture.js').then((obj) => {
        expect(obj).toStrictEqual({
          nested: 'fixture',
        })
      })
    })
  })

  describe('json files', () => {
    it('throws when json is invalid', () => {
      return fixture.get(fixturesFolder, 'bad_json.json')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).toMatchSnapshot('invalid json error message')
      })
    })

    it('does not reformat json on parse error', () => {
      return fixture.get(fixturesFolder, 'bad_json.json')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        // ensure the bad_json file was kept as before
        return fs.readFileAsync(`${fixturesFolder}/bad_json.json`, 'utf8').then((str) => {
          expect(str).toBe(`\
{
  "bad": "json"
  "should": "not parse"
}\
`)
        })
      })
    })

    it('does not reformat json or write fixture file', () => {
      return fixture.get(fixturesFolder, 'no_format.json').then((obj) => {
        return fs.readFileAsync(`${fixturesFolder}/no_format.json`, 'utf8').then((json) => {
          expect(json).toBe('{"id": 1, "name": "brian"}')
        })
      })
    })

    it('does not remove string whitespace', () => {
      return fixture.get(fixturesFolder, 'words.json').then((obj) => {
        return fs.readFileAsync(`${fixturesFolder}/words.json`, 'utf8').then((json) => {
          expect(json).toBe(`\
{
  "some": "multiple space separate words",
  "that": "should keep their spaces"
}\
`)
        })
      })
    })

    it('parses json to valid JS object', () => {
      return fixture.get(fixturesFolder, 'users.json').then((users) => {
        expect(users).toStrictEqual([
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

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23457
    it('does not reformat empty objects', { retry: 15 }, () => {
      const fn = () => {
        return fixture.get(fixturesFolder, 'empty_objects')
      }

      return Bluebird.map(Array(500), fn, { concurrency: 5 }).then(() => {
        return fs.readFileAsync(`${fixturesFolder}/empty_objects.json`, 'utf8').then((str) => {
          expect(str).toBe(`\
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
      vi.spyOn(ctx.browser, 'machineBrowsers').mockResolvedValue([
        {
          channel: 'stable',
          displayName: 'Electron',
          family: 'chromium',
          majorVersion: '123',
          name: 'electron',
          path: 'path-to-browser-one',
          version: '123.45.67',
        },
      ])

      const projectPath = FixturesHelper.projectPath('folder-same-as-fixture')

      await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(projectPath)

      return ctx.lifecycleManager.getFullInitialConfig()
      .then((cfg) => {
        return fixture.get(cfg.fixturesFolder, 'foo')
        .then((result) => {
          expect(result).toStrictEqual({ 'bar': 'baz' })
        })
      })
    })

    it('should return encoded JSON', async () => {
      const fixtures = [
        { encoding: '', content: Buffer.from('[{"json": true}]') },
        { encoding: 'base64', content: 'W3sianNvbiI6IHRydWV9XQ==' },
        { encoding: 'utf8', content: '[{"json": true}]' },
        { encoding: null, content: Buffer.from('[{"json": true}]') },
        { encoding: undefined, content: [{ json: true }] },
      ]

      for (const { encoding, content } of fixtures) {
        const result = await fixture.get(fixturesFolder, 'foo', { encoding })

        expect(result).toStrictEqual(content)
      }
    })
  })

  describe('js files', () => {
    it('returns valid JS object', () => {
      return fixture.get(fixturesFolder, 'user.js').then((user) => {
        expect(user).toStrictEqual({
          id: 1,
          name: 'brian',
          age: 29,
          posts: [],
        })
      })
    })

    it('does not rewrite file as a formated valid JS object', () => {
      return fixture.get(fixturesFolder, 'no_format.js').then((obj) => {
        return fs.readFileAsync(`${fixturesFolder}/no_format.js`, 'utf8').then((str) => {
          expect(str).toBe('{foo: "bar", baz: "quux"}')
        })
      })
    })

    it('throws on a bad JS object', () => {
      const e =
        `\
bad_js.js:3
  bar: "bar
       ^
ParseError: Unterminated string constant\
`

      return fixture.get(fixturesFolder, 'bad_js.js')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).toBe(`'bad_js.js' is not a valid JavaScript object.\n\n${e}`)
      })
    })
  })

  describe('html files', () => {
    it('returns html as a string', () => {
      return fixture.get(fixturesFolder, 'index.html').then((index) => {
        expect(index).toBe(`\
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

    it('does not rewrite file as formatted html', () => {
      return fixture.get(fixturesFolder, 'index.html').then(() => {
        return fs.readFileAsync(`${fixturesFolder}/index.html`, 'utf8').then((str) => {
          expect(str).toBe(`\
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

  describe('txt files', () => {
    it('returns text as string', () => {
      return fixture.get(fixturesFolder, 'message.txt').then((index) => {
        expect(index).toBe('foobarbaz')
      })
    })
  })

  describe('csv files', () => {
    it('returns text as string', () => {
      return fixture.get(fixturesFolder, 'data.csv').then((index) => {
        expect(index).toBe(`\
Name,Occupation,Birth Year
Jane,Engineer,1976
John,Chef,1982
\
`)
      })
    })
  })

  describe('file with unknown extension', () => {
    it('returns text as string', () => {
      return fixture.get(fixturesFolder, 'unknown_ext.yaml').then((index) => {
        expect(index).toBe(`\
- foo
- bar
- 
\
`)
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/1558
  describe('binary files', () => {
    it('returns file as buffer regardless of extension when passed null encoding', () => {
      return fixture.get(fixturesFolder, 'nested/fixture.js', { encoding: null }).then((index) => {
        expect(index).toStrictEqual(Buffer.from('{nested: "fixture"}'))
      })
    })
  })

  describe('file with unknown extension and encoding specified', () => {
    it('returns text encoded as specified', () => {
      return fixture.get(fixturesFolder, 'ascii.foo', { encoding: 'ascii' }).then((index) => {
        expect(index).toBe('o#?\n')
      })
    })
  })

  describe('image files', () => {
    it('returns png as buffer', () => {
      return read(fixturesFolder, 'images/flower.png')
      .then((file) => {
        return fixture.get(fixturesFolder, 'images/flower.png')
        .then((result) => {
          expect(result).toStrictEqual(file)
        })
      })
    })

    it('returns jpg as buffer', () => {
      return read(fixturesFolder, 'images/sample.jpg')
      .then((file) => {
        return fixture.get(fixturesFolder, 'images/sample.jpg')
        .then((result) => {
          expect(result).toStrictEqual(file)
        })
      })
    })

    it('returns gif as buffer', () => {
      return read(fixturesFolder, 'images/word.gif')
      .then((file) => {
        return fixture.get(fixturesFolder, 'images/word.gif')
        .then((result) => {
          expect(result).toStrictEqual(file)
        })
      })
    })

    it('returns tif as buffer', () => {
      return read(fixturesFolder, 'images/sample.tif')
      .then((file) => {
        return fixture.get(fixturesFolder, 'images/sample.tif')
        .then((result) => {
          expect(result).toStrictEqual(file)
        })
      })
    })

    it('returns png as binary if that encoding is requested', () => {
      return read(fixturesFolder, 'images/flower.png', 'binary')
      .then((file) => {
        return fixture.get(fixturesFolder, 'images/flower.png', { encoding: 'binary' })
        .then((result) => {
          expect(result).toBe(file)
        })
      })
    })
  })

  describe('zip files', () => {
    it('returns zip as buffer', () => {
      return read(fixturesFolder, 'example.zip')
      .then((file) => {
        return fixture.get(fixturesFolder, 'example.zip').then((result) => {
          expect(result).toStrictEqual(file)
        })
      })
    })
  })

  describe('extension omitted', () => {
    it('#1 finds json', () => {
      return fixture.get(fixturesFolder, 'foo').then((obj) => {
        expect(obj).toStrictEqual([
          { json: true },
        ])
      })
    })

    it('#2 finds js', () => {
      return fixture.get(fixturesFolder, 'bar').then((obj) => {
        expect(obj).toStrictEqual({ js: true })
      })
    })

    it('throws when no file by any extension can be found', () => {
      return fixture.get(fixturesFolder, 'does-not-exist')
      .then(() => {
        throw new Error('should have failed but did not')
      }).catch((err) => {
        expect(err.message).toContain('A fixture file could not be found')
        expect(err.message).toContain('/does-not-exist')
      })
    })
  })

  describe('new lines', () => {
    it('does not remove trailing new lines on .txt', () => {
      return fixture.get(fixturesFolder, 'trailing_new_line.txt').then((str) => {
        return fs.readFileAsync(`${fixturesFolder}/trailing_new_line.txt`, 'utf8').then((str2) => {
          expect(str2).toBe('foo\nbar\nbaz\n')
        })
      })
    })

    it('does not remove trailing new lines on .json', () => {
      return fixture.get(fixturesFolder, 'trailing_new_line.json').then((str) => {
        return fs.readFileAsync(`${fixturesFolder}/trailing_new_line.json`, 'utf8').then((str2) => {
          expect(str2).toBe('{"foo": "bar"}\n')
        })
      })
    })

    it('does not remove trailing new lines on .js', () => {
      return fixture.get(fixturesFolder, 'trailing_new_line.js').then((str) => {
        return fs.readFileAsync(`${fixturesFolder}/trailing_new_line.js`, 'utf8').then((str2) => {
          expect(str2).toBe('{foo: "bar"}\n')
        })
      })
    })

    it('does not remove trailing new lines on .html', () => {
      return fixture.get(fixturesFolder, 'trailing_new_line.html').then((str) => {
        return fs.readFileAsync(`${fixturesFolder}/trailing_new_line.html`, 'utf8').then((str2) => {
          expect(str2).toBe('<html><body>foo</body></html>\n')
        })
      })
    })
  })
})
