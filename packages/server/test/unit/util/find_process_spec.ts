import utils from 'find-process/lib/utils'
import { sinon } from '../../spec_helper'
import { byPid } from '../../../lib/util/find_process'

describe('lib/util/find_process', function () {
  // This is testing the patch for find-process to handle windows processes that have a mixture of carriage returns
  it('does not crash in windows with processes that deal with a mixture of carriage returns', async () => {
    sinon.stub(process, 'platform').value('win32')
    // Create a table that matches what 'Get-CimInstance -className win32_process | select Name,ProcessId,ParentProcessId,CommandLine,ExecutablePath' does in powershell
    // Attempt to include all of this regex: (\r\n\r\n|\r\n\n|\n\r\n|\n\n)
    const process1 = 'Name : abc\r\nProcessId : 123\r\nParentProcessId : 456\r\nCommandLine : "c:\\path\\to\\abc.exe"\r\nExecutablePath : c:\\path\\to\\abc.exe'
    const process2 = 'Name : xyz\r\nProcessId : 789\r\nParentProcessId : 1011\r\nCommandLine : "c:\\path\\to\\xyz.exe"\r\nExecutablePath : c:\\path\\to\\xyz.exe'
    const process3 = 'Name : def\r\nProcessId : 1213\r\nParentProcessId : 1415\r\nCommandLine : "c:\\path\\to\\def.exe"\r\nExecutablePath : c:\\path\\to\\def.exe'
    const process4 = 'Name : ghi\r\nProcessId : 1617\r\nParentProcessId : 1819\r\nCommandLine : "c:\\path\\to\\ghi.exe"\r\nExecutablePath : c:\\path\\to\\ghi.exe'
    const process5 = 'Name : jkl\r\nProcessId : 2021\r\nParentProcessId : 2223\r\nCommandLine : "c:\\path\\to\\jkl.exe"\r\nExecutablePath : c:\\path\\to\\jkl.exe'
    const returnString = `${process1}\r\n\r\n${process2}\r\n\n${process3}\n\r\n${process4}\n\n${process5}`

    sinon.stub(utils, 'spawn').returns({
      stdout: {
        on: (event: string, callback: (data: string) => void) => {
          if (event === 'data') {
            callback(returnString)
          }
        },
      },
      on: (event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          callback(0)
        }
      },
    })

    const result1 = await byPid(123)

    expect(result1).to.eql([{
      pid: 123,
      ppid: 456,
      name: 'abc',
      cmd: '"c:\\path\\to\\abc.exe"',
      bin: 'c:\\path\\to\\abc.exe',
    }])

    const result2 = await byPid(789)

    expect(result2).to.eql([{
      pid: 789,
      ppid: 1011,
      name: 'xyz',
      cmd: '"c:\\path\\to\\xyz.exe"',
      bin: 'c:\\path\\to\\xyz.exe',
    }])

    const result3 = await byPid(1213)

    expect(result3).to.eql([{
      pid: 1213,
      ppid: 1415,
      name: 'def',
      cmd: '"c:\\path\\to\\def.exe"',
      bin: 'c:\\path\\to\\def.exe',
    }])

    const result4 = await byPid(1617)

    expect(result4).to.eql([{
      pid: 1617,
      ppid: 1819,
      name: 'ghi',
      cmd: '"c:\\path\\to\\ghi.exe"',
      bin: 'c:\\path\\to\\ghi.exe',
    }])

    const result5 = await byPid(2021)

    expect(result5).to.eql([{
      pid: 2021,
      ppid: 2223,
      name: 'jkl',
      cmd: '"c:\\path\\to\\jkl.exe"',
      bin: 'c:\\path\\to\\jkl.exe',
    }])
  })
})
