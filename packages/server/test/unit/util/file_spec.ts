import '../../spec_helper'

import os from 'os'
import path from 'path'
import Promise from 'bluebird'
import lockFileModule from 'lockfile'
import { fs } from '../../../lib/util/fs'
import * as env from '../../../lib/util/env'
import { GracefulExit } from '../../../lib/util/graceful-exit'
import { File as FileUtil } from '../../../lib/util/file'

const lockFile = Promise.promisifyAll(lockFileModule)

const lockError = () => ({ name: '', message: '', code: 'EEXIST' })

/** Introspect GracefulExit for regressions on File teardown registration (not public API). */
function countUnlockLockfileSteps (): number {
  const singleton = (GracefulExit as unknown as { singleton: { steps: Map<string, { name: string }> } }).singleton

  return [...singleton.steps.values()].filter((s) => s.name === 'unlock lockfile').length
}

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

  it('unlocks a held lock on exit', function () {
    const fileUtil = new FileUtil({ path: this.path })
    let teardownStep: () => Promise<void>

    sinon.spy(lockFile, 'unlockSync')
    sinon.stub(GracefulExit, 'removeStep')
    sinon.stub(GracefulExit, 'addStep').callsFake((fn: () => Promise<void> | void) => {
      teardownStep = fn as () => Promise<void>

      return 'test-step'
    })

    return fileUtil._lock()
    .then(() => {
      return teardownStep!()
    })
    .then(() => {
      expect(lockFile.unlockSync).to.be.calledWith(fileUtil._lockFilePath)

      return fs.pathExistsAsync(fileUtil._lockFilePath)
    })
    .then((exists) => {
      expect(exists).to.be.false
    })
  })

  it('does not unlock on exit once the lock was released', function () {
    const fileUtil = new FileUtil({ path: this.path })
    let teardownStep: () => Promise<void>

    sinon.spy(lockFile, 'unlockSync')
    sinon.stub(GracefulExit, 'removeStep')
    sinon.stub(GracefulExit, 'addStep').callsFake((fn: () => Promise<void> | void) => {
      teardownStep = fn as () => Promise<void>

      return 'test-step'
    })

    return fileUtil._lock()
    .then((unlock) => {
      return unlock()
    })
    .then(() => {
      return teardownStep!()
    })
    .then(() => {
      expect(lockFile.unlockSync).not.to.be.called
    })
  })

  it('does not register a GracefulExit step until a lock is acquired', function () {
    sinon.spy(GracefulExit, 'addStep')

    new FileUtil({ path: this.path })

    expect(GracefulExit.addStep).not.to.be.called
  })

  it('does not leave orphaned GracefulExit unlock steps when ephemeral File instances are discarded', function () {
    const before = countUnlockLockfileSteps()

    for (let i = 0; i < 3; i++) {
      new FileUtil({ path: path.join(this.dir, `ephemeral-${i}.json`) })
    }

    // Each File should remove its GracefulExit step when the instance is no longer needed, so
    // unreferenced instances must not accumulate unlock handlers (see lib/util/file.ts).
    expect(
      countUnlockLockfileSteps(),
      'ephemeral File instances must not leave GracefulExit unlock steps registered after they are discarded',
    ).to.equal(before)
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

    it('rejects with a lock error when it can\'t get lock on file on initial read', function () {
      const original = lockError()

      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeJsonAsync(this.path, { foo: 'bar' })
      }).then(() => {
        sinon.stub(lockFile, 'lockAsync').rejects(original)

        return this.fileUtil.get()
      }).then(() => {
        throw new Error('should have rejected')
      }, (err) => {
        expect(err.message).to.include(this.path)
        expect(err.message).to.include('another Cypress process appears to hold its lock')
        expect(err.cause).to.equal(original)
      })
    })

    it('reads from disk again after a lock failure instead of resolving the empty cache', function () {
      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeJsonAsync(this.path, { foo: 'bar' })
      }).then(() => {
        const lockStub = sinon.stub(lockFile, 'lockAsync').rejects(lockError())

        return this.fileUtil.get()
        .catch(() => {
          lockStub.restore()

          return this.fileUtil.get()
        })
      }).then((contents) => {
        expect(contents).to.eql({ foo: 'bar' })
      })
    })

    it('does not unlock when it can\'t get lock on file', function () {
      sinon.stub(lockFile, 'lockAsync').rejects(lockError())
      sinon.spy(lockFile, 'unlockAsync')

      return this.fileUtil.get()
      .then(() => {
        throw new Error('should have rejected')
      }, () => {
        expect(lockFile.unlockAsync).not.to.be.called
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

    it('unlocks file if the lock was acquired and reading then fails', function () {
      sinon.spy(lockFile, 'lockAsync')
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'readJsonAsync').rejects(new Error('fail!'))

      return this.fileUtil.get()
      .then(() => {
        throw new Error('should have rejected')
      }, (err) => {
        expect(err.message).to.eq('fail!')
        expect(lockFile.lockAsync).to.be.calledOnce
        expect(lockFile.unlockAsync).to.be.calledOnce
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

    it('unlocks file if the lock was acquired and writing then fails', function () {
      sinon.spy(lockFile, 'lockAsync')
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'outputJsonAsync').rejects(new Error('fail!'))

      return this.fileUtil.set('foo', 'bar')
      .then(() => {
        throw new Error('should have rejected')
      }, (err) => {
        expect(err.message).to.eq('fail!')
        // one lock for the read, one for the write
        expect(lockFile.lockAsync).to.be.calledTwice
        expect(lockFile.unlockAsync).to.be.calledTwice
      })
    })

    context('when the lock can\'t be acquired', () => {
      beforeEach(function () {
        return fs.ensureDirAsync(this.dir)
        .then(() => {
          return fs.writeJsonAsync(this.path, { foo: 'bar', baz: 'qux' })
        }).then(() => {
          sinon.stub(lockFile, 'lockAsync').rejects(lockError())
          sinon.spy(lockFile, 'unlockAsync')
          sinon.spy(fs, 'outputJsonAsync')
        })
      })

      it('rejects without writing from set()', function () {
        return this.fileUtil.set('foo', 'changed')
        .then(() => {
          throw new Error('should have rejected')
        }, (err) => {
          expect(err.message).to.include('another Cypress process appears to hold its lock')
          expect(fs.outputJsonAsync).not.to.be.called
          expect(lockFile.unlockAsync).not.to.be.called

          return fs.readJsonAsync(this.path)
        }).then((contents) => {
          expect(contents).to.eql({ foo: 'bar', baz: 'qux' })
        })
      })

      it('rejects without writing from transaction()', function () {
        return this.fileUtil.transaction((tx) => {
          return tx.set('foo', 'changed')
        })
        .then(() => {
          throw new Error('should have rejected')
        }, (err) => {
          expect(err.message).to.include('another Cypress process appears to hold its lock')
          expect(fs.outputJsonAsync).not.to.be.called
          expect(lockFile.unlockAsync).not.to.be.called

          return fs.readJsonAsync(this.path)
        }).then((contents) => {
          expect(contents).to.eql({ foo: 'bar', baz: 'qux' })
        })
      })

      it('does not write an empty object from set() after a failed get()', function () {
        return this.fileUtil.get()
        .catch(() => {
          return this.fileUtil.set('foo', 'changed')
        })
        .then(() => {
          throw new Error('should have rejected')
        }, () => {
          expect(fs.outputJsonAsync).not.to.be.called

          return fs.readJsonAsync(this.path)
        }).then((contents) => {
          expect(contents).to.eql({ foo: 'bar', baz: 'qux' })
        })
      })
    })
  })

  context('across instances sharing a lock file', () => {
    it('does not remove the lock held by another instance when it times out', function () {
      const holder = new FileUtil({ path: this.path })
      const waiter = new FileUtil({ path: this.path })
      const lockAsync = lockFile.lockAsync

      // shorten the wait so the waiter times out quickly
      sinon.stub(lockFile, 'lockAsync').callsFake((lockPath, opts) => {
        return lockAsync.call(lockFile, lockPath, { ...opts, wait: 200 })
      })

      return holder._lock()
      .then((unlock) => {
        return waiter.get()
        .then(() => {
          throw new Error('should have rejected')
        }, (err) => {
          expect(err.message).to.include('another Cypress process appears to hold its lock')

          return fs.pathExistsAsync(holder._lockFilePath)
        })
        .then((exists) => {
          expect(exists, 'holder\'s lock file').to.be.true

          return unlock()
        })
      })
      .then(() => {
        return fs.pathExistsAsync(holder._lockFilePath)
      })
      .then((exists) => {
        expect(exists).to.be.false
      })
    })

    it('takes over a stale lock left by a process that died', function () {
      const fileUtil = new FileUtil({ path: this.path })

      return fs.ensureDirAsync(this.dir)
      .then(() => {
        return fs.writeJsonAsync(this.path, { foo: 'bar' })
      })
      .then(() => {
        return fs.ensureDirAsync(fileUtil._lockFileDir)
      })
      .then(() => {
        return fs.writeFileAsync(fileUtil._lockFilePath, '')
      })
      .then(() => {
        // lockfile ages locks by ctime on POSIX, which can't be backdated,
        // so move the clock forward instead
        sinon.useFakeTimers({ now: Date.now() + 60 * 1000, toFake: ['Date'] })

        return fileUtil.get()
      })
      .then((contents) => {
        expect(contents).to.eql({ foo: 'bar' })

        return fs.pathExistsAsync(fileUtil._lockFilePath)
      })
      .then((exists) => {
        expect(exists).to.be.false
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

    it('unlocks file if the lock was acquired and removing then fails', function () {
      sinon.spy(lockFile, 'lockAsync')
      sinon.spy(lockFile, 'unlockAsync')
      sinon.stub(fs, 'removeAsync').rejects(new Error('fail!'))

      return this.fileUtil.remove()
      .then(() => {
        throw new Error('should have caught!')
      }).catch((err) => {
        expect(err.message).to.eq('fail!')

        expect(lockFile.lockAsync).to.be.calledOnce
        expect(lockFile.unlockAsync).to.be.calledOnce
      })
    })

    it('does not unlock or remove when it can\'t get lock on file', function () {
      sinon.stub(lockFile, 'lockAsync').rejects(lockError())
      sinon.spy(lockFile, 'unlockAsync')
      sinon.spy(fs, 'removeAsync')

      return this.fileUtil.remove()
      .then(() => {
        throw new Error('should have rejected')
      }, (err) => {
        expect(err.message).to.include('another Cypress process appears to hold its lock')
        expect(fs.removeAsync).not.to.be.called
        expect(lockFile.unlockAsync).not.to.be.called
      })
    })
  })
})
