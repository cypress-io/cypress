import path from 'path'

import { expect } from 'chai'
import type { Cfg } from '../../lib/project-base'
import { privilegedCommandsManager } from '../../lib/privileged-commands/privileged-commands-manager'
import '../spec_helper'

describe('lib/privileged-commands/privileged-commands-manager', () => {
  const verifiedCommandUrl = 'http://localhost:1234/__cypress/tests?p=cypress/e2e/spec.cy.js'
  const verifiedCommandKey = 'verified-command-key'
  const projectRoot = '/project/root'
  const config = {
    projectRoot,
    testingType: 'e2e',
  } satisfies Pick<Cfg, 'projectRoot' | 'testingType'>
  const unsupportedRunPrivilegedCommands = ['readFile', 'selectFile'] as const

  beforeEach(() => {
    privilegedCommandsManager.reset()
  })

  const addVerifiedCommand = (name: string) => {
    privilegedCommandsManager.channelKeys[verifiedCommandUrl] = verifiedCommandKey
    privilegedCommandsManager.addVerifiedCommand({
      args: ['arg-hash'],
      key: verifiedCommandKey,
      name,
      url: verifiedCommandUrl,
    })
  }

  it('should create one-time file read tokens for verified commands', () => {
    addVerifiedCommand('readFile')

    const fileRead = privilegedCommandsManager.createPrivilegedFileRead(config, {
      args: ['arg-hash'],
      commandName: 'readFile',
      options: {
        file: 'foo.txt',
      },
    })

    expect(fileRead.filePath).to.equal(path.resolve(projectRoot, 'foo.txt'))
    expect(fileRead.token).to.be.a('string')

    expect(privilegedCommandsManager.consumePrivilegedFileRead(fileRead.token)).to.deep.equal({
      filePath: path.resolve(projectRoot, 'foo.txt'),
      originalFilePath: 'foo.txt',
    })

    expect(() => privilegedCommandsManager.consumePrivilegedFileRead(fileRead.token)).to.throw('You requested a privileged file read with an invalid token')
  })

  it('should reject unverified privileged file reads in e2e mode', () => {
    expect(() => privilegedCommandsManager.createPrivilegedFileRead(config, {
      args: ['arg-hash'],
      commandName: 'readFile',
      options: {
        file: 'foo.txt',
      },
    })).to.throw('cy.readFile() must be invoked from the spec file or support file')
  })

  it('should reject unsupported privileged file read commands', () => {
    addVerifiedCommand('writeFile')

    expect(() => privilegedCommandsManager.createPrivilegedFileRead(config, {
      args: ['arg-hash'],
      commandName: 'writeFile',
      options: {
        file: 'foo.txt',
      },
    })).to.throw(
      'You requested a privileged file read for a command we cannot handle: writeFile',
    )
  })

  unsupportedRunPrivilegedCommands.forEach((commandName) => {
    it(`should reject ${commandName} through runPrivilegedCommand`, () => {
      addVerifiedCommand(commandName)

      expect(() =>
        privilegedCommandsManager.runPrivilegedCommand(config, {
          args: ['arg-hash'],
          commandName,
          options: {
            file: 'foo.txt',
          },
        }),
      ).to.throw(
        `You requested a secure backend event for a command we cannot handle: ${
          commandName
        }`,
      )
    })
  })
})
