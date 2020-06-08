require('../spec_helper')

const os = require('os')
const path = require('path')
const Promise = require('bluebird')
const lockFile = Promise.promisifyAll(require('lockfile'))
const fs = require(`${root}lib/util/fs`)
const env = require(`${root}lib/util/env`)
const exit = require(`${root}lib/util/exit`)
const FileUtil = require(`${root}lib/util/file`)

describe('lib/util/file', () => {
  beforeEach(function () {
    this.dir = path.join(os.tmpdir(), 'cypress', 'file_spec')
    this.path = path.join(this.dir, 'file.json')

    return fs.removeAsync(this.dir).catch(() => {})
  })

  // ignore error if directory didn't exist in the first place
  it('throws if path is not specified', () => {
    expect(() => {
      return new FileUtil()
    }).to.throw('Must specify path to file when creating new FileUtil()')
  })

  it('unlocks file on exit', function () {
    sinon.spy(lockFile, 'unlockSync')
    sinon.stub(exit, 'ensure')
    new FileUtil({ path: this.path })
    exit.ensure.yield()

    expect(lockFile.unlockSync).to.be.called
  })

  context('#transaction', () => {
    beforeEach(function () {
      this.fileUtil = new FileUtil({ path: this.path })
    })

    it('ensures returned promise completely resolves before moving on with queue', function () {
      return Promise.all([
        this.fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('foo'))
          })
        }),

        this.fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('bar'))
          })
        }),

        this.fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('baz'))
          })
        }),
      ])
      .then(() => {
        return this.fileUtil.transaction((tx) => {
          return tx.get('items').then((items) => {
            expect(items).to.eql(['foo', 'bar', 'baz'])
          })
        })
      })
    })
  })

  context('#get', () => {
    beforeEach(function () {
      this.fileUtil = new FileUtil({ path: this.path })
    })

    it('resolves entire object if given no key', function () {
      return this.fileUtil.get().then((contents) => {
        expect(contents).to.eql({})
      })
    })

    it('resolves value for key when one is set', function () {
      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        return this.fileUtil.get('foo')
      }).then((value) => {
        expect(value).to.equal('bar')
      })
    })

    it('resolves value for path when one is set', function () {
      return this.fileUtil.set('foo.baz', 'bar')
      .then(() => {
        return this.fileUtil.get('foo.baz')
      }).then((value) => {
        expect(value).to.equal('bar')
      })
    })

    it('resolves default value if given key is undefined', function () {
      return this.fileUtil.get('foo', 'default').then((value) => {
        expect(value).to.equal('default')
      })
    })

    it('resolves undefined if value is undefined', function () {
      return this.fileUtil.get('foo').then((value) => {
        expect(value).to.be.undefined
      })
    })

    it('resolves null if value is null', function () {
      return this.fileUtil.set('foo', null)
      .then(() => {
        return this.fileUtil.get('foo')
      }).then((value) => {
        expect(value).to.be.null
      })
    })

    it('resolves empty object when contents file does not exist', function () {
      return fs.removeAsync(this.dir)
      .then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({})
      })
    })

    it('resolves empty object when contents file is empty', function () {
      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeFileAsync(path.join(this.dir, 'file.json'), '')
      }).then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({})
      })
    })

    it('resolves empty object when it can\'t get lock on file on initial read', function () {
      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeJsonAsync(this.path, { foo: 'bar' })
      }).then(() => {
        sinon.stub(lockFile, 'lockAsync').rejects({ name: '', message: '', code: 'EEXIST' })

        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({})
      })
    })

    it('resolves cached contents when it can\'t get lock on file after an initial read', function () {
      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        sinon.stub(lockFile, 'lockAsync').rejects({ name: '', message: '', code: 'EEXIST' })

        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({ foo: 'bar' })
      })
    })

    it('resolves empty object when contents file has invalid json', function () {
      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeFileAsync(path.join(this.dir, 'file.json'), '{')
      }).then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({})
      })
    })

    it('debounces reading from disk', function () {
      sinon.stub(fs, 'readJsonAsync').resolves({})

      return Promise.all([
        this.fileUtil.get(),
        this.fileUtil.get(),
        this.fileUtil.get(),
      ])
      .then(() => {
        expect(fs.readJsonAsync).to.be.calledOnce
      })
    })

    it('locks file while reading', function () {
      sinon.spy(lockFile, 'lockAsync')

      return this.fileUtil.get().then(() => {
        expect(lockFile.lockAsync).to.be.called
      })
    })

    it('unlocks file when finished reading', function () {
      sinon.spy(lockFile, 'unlockAsync')

      return this.fileUtil.get().then(() => {
        expect(lockFile.unlockAsync).to.be.called
      })
    })

    it('unlocks file even if reading fails', function () {
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'readJsonAsync').rejects(new Error('fail!'))

      return this.fileUtil.get().catch(() => {
        expect(lockFile.unlockAsync).to.be.called
      })
    })

    it('times out and carries on if unlocking times out', function () {
      sinon.stub(lockFile, 'lockAsync').resolves()
      sinon.stub(lockFile, 'unlockAsync').callsFake(() => {
        return Promise.delay(1e9)
      })

      sinon.stub(fs, 'readJsonAsync').resolves({})
      sinon.stub(env, 'get').withArgs('FILE_UNLOCK_TIMEOUT').returns(100)

      return this.fileUtil.get()
    })
  })

  context('#set', () => {
    beforeEach(function () {
      this.fileUtil = new FileUtil({ path: this.path })
    })

    it('throws if 1st argument is not a string or plain object', function () {
      expect(() => {
        return this.fileUtil.set(1)
      }).to.throw('Expected `key` to be of type `string` or `object`, got `number`')

      expect(() => {
        return this.fileUtil.set([])
      }).to.throw('Expected `key` to be of type `string` or `object`, got `array`')
    })

    it('sets value for given key', function () {
      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        return this.fileUtil.get('foo')
      }).then((value) => {
        expect(value).to.equal('bar')
      })
    })

    it('sets value for given path', function () {
      return this.fileUtil.set('foo.baz', 'bar')
      .then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({
          foo: {
            baz: 'bar',
          },
        })
      })
    })

    it('sets values for object', function () {
      return this.fileUtil.set({
        foo: 'bar',
        baz: {
          qux: 'lolz',
        },
      })
      .then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({
          foo: 'bar',
          baz: {
            qux: 'lolz',
          },
        })
      })
    })

    it('leaves existing values alone', function () {
      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        return this.fileUtil.set('baz', 'qux')
      }).then(() => {
        return this.fileUtil.get()
      }).then((contents) => {
        expect(contents).to.eql({
          foo: 'bar',
          baz: 'qux',
        })
      })
    })

    it('updates file on disk', function () {
      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        return fs.readFileAsync(path.join(this.dir, 'file.json'), 'utf8')
      }).then((contents) => {
        expect(JSON.parse(contents)).to.eql({ foo: 'bar' })
      })
    })

    it('locks file while writing', function () {
      sinon.spy(lockFile, 'lockAsync')

      return this.fileUtil.set('foo', 'bar').then(() => {
        expect(lockFile.lockAsync).to.be.called
      })
    })

    it('unlocks file when finished writing', function () {
      sinon.spy(lockFile, 'unlockAsync')

      return this.fileUtil.set('foo', 'bar').then(() => {
        expect(lockFile.unlockAsync).to.be.called
      })
    })

    it('unlocks file even if writing fails', function () {
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'outputJsonAsync').rejects(new Error('fail!'))

      return this.fileUtil.set('foo', 'bar').catch(() => {
        expect(lockFile.unlockAsync).to.be.called
      })
    })
  })

  context('#remove', () => {
    beforeEach(function () {
      this.fileUtil = new FileUtil({ path: this.path })
    })

    it('removes the file', function () {
      return this.fileUtil.remove()
      .then(() => {
        return fs.statAsync(this.path)
      }).catch(() => {})
    })

    it('locks file while removing', function () {
      sinon.spy(lockFile, 'lockAsync')

      return this.fileUtil.remove().then(() => {
        expect(lockFile.lockAsync).to.be.called
      })
    })

    it('unlocks file when finished removing', function () {
      sinon.spy(lockFile, 'unlockAsync')

      return this.fileUtil.remove()
      .then(() => {
        expect(lockFile.unlockAsync).to.be.called
      })
    })

    it('unlocks file even if removing fails', function () {
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'removeAsync').rejects(new Error('fail!'))

      return this.fileUtil.remove()
      .then(() => {
        throw new Error('should have caught!')
      }).catch((err) => {
        expect(err.message).to.eq('fail!')

        expect(lockFile.unlockAsync).to.be.called
      })
    })
  })
})
