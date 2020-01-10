require('../spec_helper')

const os = require('os')
const path = require('path')
const Bluebird = require('bluebird')
const { cache, render } = require('../../lib/template_engine')
const fs = require('../../lib/util/fs')

describe('lib/template_engine', () => {
  it('renders and caches a template function', () => {
    sinon.spy(fs, 'readFile')

    expect(cache).to.deep.eq({})

    const tmpPath = path.join(os.tmpdir(), 'index.html')

    return fs
    .writeFileAsync(tmpPath, 'My favorite template engine is {{favorite}}.')
    .then(() => {
      return Bluebird.fromCallback((cb) => {
        const opts = {
          favorite: 'Squirrelly',
        }

        return render(tmpPath, opts, cb)
      })
    })
    .then((str) => {
      expect(str).to.eq('My favorite template engine is Squirrelly.')

      expect(fs.readFile).to.be.calledOnce

      const compiledFn = cache[tmpPath]

      expect(compiledFn).to.be.a('function')

      return Bluebird.fromCallback((cb) => {
        const opts = {
          favorite: 'Squirrelly2',
        }

        return render(tmpPath, opts, cb)
      })
      .then((str) => {
        expect(str).to.eq('My favorite template engine is Squirrelly2.')

        expect(cache[tmpPath]).to.eq(compiledFn)

        expect(fs.readFile).to.be.calledOnce
      })
    })
  })
})
