require('../spec_helper')

let { exec } = require('child_process')
let fs = require('fs-extra')
const eol = require('eol')
const path = require('path')
const Promise = require('bluebird')
const extension = require('../../index')

const cwd = process.cwd()

fs = Promise.promisifyAll(fs)
exec = Promise.promisify(exec)

describe('Extension', () => {
  context('.getCookieUrl', () => {
    it('returns cookie url', () => {
      expect(extension.getCookieUrl({
        name: 'foo',
        value: 'bar',
        path: '/foo/bar',
        domain: 'www.google.com',
        secure: true,
      })).to.eq('https://www.google.com/foo/bar')
    })
  })

  context('.getPathToExtension', () => {
    it('returns path to dist/v2', () => {
      const result = extension.getPathToExtension()
      const expected = path.join(cwd, 'dist', 'v2')

      expect(path.normalize(result)).to.eq(path.normalize(expected))
    })

    it('returns path to files in dist/v2', () => {
      const result = extension.getPathToExtension('background.js')
      const expected = path.join(cwd, '/dist/v2/background.js')

      expect(path.normalize(result)).to.eq(path.normalize(expected))
    })
  })

  context('.getPathToV3Extension', () => {
    it('returns path to dist/v3', () => {
      const result = extension.getPathToV3Extension()
      const expected = path.join(cwd, 'dist', 'v3')

      expect(path.normalize(result)).to.eq(path.normalize(expected))
    })
  })

  context('.getPathToTheme', () => {
    it('returns path to theme', () => {
      const result = extension.getPathToTheme()
      const expected = path.join(cwd, 'theme')

      expect(path.normalize(result)).to.eq(path.normalize(expected))
    })
  })

  context('.getPathToRoot', () => {
    it('returns path to root', () => {
      expect(extension.getPathToRoot()).to.eq(cwd)
    })
  })

  context('.setHostAndPath', () => {
    beforeEach(function () {
      this.src = path.join(cwd, 'test', 'helpers', 'background.js')

      return sinon.stub(extension, 'getPathToExtension')
      .withArgs('background.js').returns(this.src)
    })

    it('rewrites the background.js source', () => {
      return extension.setHostAndPath('http://dev.local:8080', '/__foo')
      .then((str) => {
        const result = eol.auto(str)
        const expected = eol.auto(`\
(function() {
  var HOST, PATH, automation, client, fail, invoke,
    slice = [].slice;

  HOST = "http://dev.local:8080";

  PATH = "/__foo";

  client = io.connect(HOST, {
    path: PATH
  });

  automation = {
    getAllCookies: function(filter, fn) {
      if (filter == null) {
        filter = {};
      }
      return chrome.cookies.getAll(filter, fn);
    }
  };

}).call(this);
\
`)

        expect(result).to.eq(expected)
      })
    })

    it('does not mutate background.js', function () {
      return fs.readFileAsync(this.src, 'utf8')
      .then((str) => {
        return extension.setHostAndPath('http://dev.local:8080', '/__foo')
        .then(() => {
          return fs.readFileAsync(this.src, 'utf8')
        }).then((str2) => {
          expect(str).to.eq(str2)
        })
      })
    })
  })

  context('manifest', () => {
    it('has a key that resolves to the static extension ID', () => {
      return fs.readJsonAsync(path.join(cwd, 'app/v2/manifest.json'))
      .then((manifest) => {
        const cmd = `echo \"${manifest.key}\" | openssl base64 -d -A | shasum -a 256 | head -c32 | tr 0-9a-f a-p`

        return exec(cmd)
        .then((stdout) => {
          expect(stdout).to.eq('caljajdfkjjjdehjdoimjkkakekklcck')
        })
      })
    })
  })
})
