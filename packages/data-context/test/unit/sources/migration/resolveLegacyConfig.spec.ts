import { getSystemTestProject } from '../../helper'
import path from 'path'
import { fork } from 'child_process'
import type { ForkOptions } from 'child_process'

// TODO: work on it
describe.skip('works', () => {
  it('works', () => {
    const dir = getSystemTestProject('migration-e2e-plugins-modify-config')
    // const ctx = createTestDataContext("open", dir)
    const CHILD_PROCESS_FILE_PATH = require.resolve('@packages/server/lib/plugins/child/require_async_child')
    const cwd = path.join(dir, 'cypress', 'plugins', 'index.js')

    const childOptions: ForkOptions = {
      // stdio: 'pipe',
      stdio: 'inherit',
      cwd: path.dirname(cwd),
      env: process.env,
    }

    const configProcessArgs = ['--projectRoot', dir, '--file', cwd]
    const proc = fork(CHILD_PROCESS_FILE_PATH, configProcessArgs, childOptions)

    proc
    .addListener('message', ({ event, args }: { event: 'ready' | 'loadLegacyPlugins:reply', args: any[] }) => {
      if (event === 'ready') {
        proc.send({ event: 'loadLegacyPlugins', args: [] })
      } else if (event === 'loadLegacyPlugins:reply') {
        // console.log('Got it', args[0].config)
      }
    })
    // proc
    // .addListener('message', (msg => {
    //   console.log('message!!', msg)
    // }))
    // .addListener('close', () => console.log('Close'))
    // .addListener('exit', () => console.log('exit'))
    // .addListener('error', () => console.log('error'))
    // .addListener('disconnect', () => console.log('DC!'))
  })
})
