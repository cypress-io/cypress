import '../../spec_helper'

import _ from 'lodash'
import si from 'systeminformation'
import { expect } from 'chai'
import {
  groupCyProcesses,
  _renameBrowserGroup,
  _aggregateGroups,
  _reset,
} from '../../../lib/util/process_profiler'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'

const browsers = require('../../../lib/browsers')
const plugins = require('../../../lib/plugins')

const BROWSER_PID = 11111
const SUB_BROWSER_PID = 11112
const GUI_PID = 77777
const PLUGIN_PID = 22222
const SUB_PLUGIN_PID = 22223
const FFMPEG_PID = 33333
const MAIN_PID = process.pid
const OTHER_PID = 66666
const ANOTHER_PID = 88888
const LAUNCHER_PID = 55555
const SHARED_BROKER_PID = 99990
const SHARED_GPU_PID = 99991
const SHARED_UTILITY_PID = 99992
const SHARED_ZYGOTE_PID = 99993

const PROCESSES: Partial<si.Systeminformation.ProcessesProcessData>[] = [
  {
    pid: MAIN_PID,
    parentPid: LAUNCHER_PID,
    params: '',
    name: 'Cypress',
  },
  {
    pid: BROWSER_PID,
    parentPid: MAIN_PID,
    params: '',
    name: 'firefox',
  },
  {
    pid: SUB_BROWSER_PID,
    parentPid: BROWSER_PID,
    params: '',
    name: 'firefox-bin',
  },
  {
    pid: GUI_PID,
    parentPid: MAIN_PID,
    params: '--type=renderer',
    name: 'Cypress',
  },
  {
    pid: PLUGIN_PID,
    parentPid: MAIN_PID,
    params: 'plugin.js',
    name: 'node',
  },
  {
    pid: SUB_PLUGIN_PID,
    parentPid: PLUGIN_PID,
    params: '',
    name: 'msword.exe',
  },
  {
    pid: FFMPEG_PID,
    parentPid: MAIN_PID,
    params: '',
    name: 'ffmpeg',
  },
  {
    pid: OTHER_PID,
    parentPid: MAIN_PID,
    params: '',
    name: 'foo',
  },
  {
    pid: ANOTHER_PID,
    parentPid: MAIN_PID,
    params: '',
    name: 'bar',
  },
  {
    pid: SHARED_GPU_PID,
    parentPid: MAIN_PID,
    params: '--type=gpu-process',
    name: 'Cypress',
  },
  {
    pid: SHARED_BROKER_PID,
    parentPid: MAIN_PID,
    params: '--type=broker',
    name: 'Cypress',
  },
  {
    pid: SHARED_UTILITY_PID,
    parentPid: MAIN_PID,
    params: '--type=utility',
    name: 'Cypress',
  },
  {
    pid: SHARED_ZYGOTE_PID,
    parentPid: MAIN_PID,
    params: '--type=zygote',
    name: 'Cypress',
  },
]

describe('lib/util/process_profiler', function () {
  beforeEach(() => {
    _reset()
  })

  context('.groupCyProcesses', () => {
    it('groups correctly', () => {
      sinon.stub(browsers, 'getBrowserInstance').returns({ pid: BROWSER_PID })
      sinon.stub(plugins, 'getPluginPid').returns(PLUGIN_PID)

      // @ts-ignore
      const groupedProcesses = groupCyProcesses({ list: PROCESSES })

      const checkGroup = (pid, group) => {
        expect(_.find(groupedProcesses, { pid }))
        .to.have.property('group')
        .eq(group)
      }

      checkGroup(BROWSER_PID, 'browser')
      checkGroup(SUB_BROWSER_PID, 'browser')
      checkGroup(GUI_PID, 'launchpad')
      checkGroup(PLUGIN_PID, 'plugin')
      checkGroup(SUB_PLUGIN_PID, 'plugin')
      checkGroup(FFMPEG_PID, 'ffmpeg')
      checkGroup(MAIN_PID, 'cypress')
      checkGroup(OTHER_PID, 'other')
      checkGroup(ANOTHER_PID, 'other')
      checkGroup(SHARED_GPU_PID, 'electron-shared')
      checkGroup(SHARED_BROKER_PID, 'electron-shared')
      checkGroup(SHARED_UTILITY_PID, 'electron-shared')
      checkGroup(SHARED_ZYGOTE_PID, 'electron-shared')
    })
  })

  context('._renameBrowserGroup', () => {
    it('renames browser-grouped processes to correct name', () => {
      sinon.stub(browsers, 'getBrowserInstance').returns({ browser: { displayName: 'FooBrowser' } })

      const processes = [
        { group: 'foo' },
        { group: 'bar' },
        { group: 'browser', pid: 1 },
        { group: 'browser', pid: 2 },
      ]

      const expected = [
        { group: 'foo' },
        { group: 'bar' },
        { group: 'FooBrowser', pid: 1 },
        { group: 'FooBrowser', pid: 2 },
      ]

      // @ts-ignore
      expect(_renameBrowserGroup(processes)).to.deep.eq(expected)
    })
  })

  context('._aggregateGroups', () => {
    it('aggregates groups as expected', () => {
      sinon.stub(browsers, 'getBrowserInstance').returns({ pid: BROWSER_PID })
      sinon.stub(plugins, 'getPluginPid').returns(PLUGIN_PID)

      const processes = _.cloneDeep(PROCESSES)
      .map((proc) => {
        // add some dummy measurements so there is data to aggregate
        proc.memRss = 10 * 1024 // 10mb
        proc.cpu = 20

        return proc
      })

      // @ts-ignore
      const result = _aggregateGroups(groupCyProcesses({ list: processes }))

      // main process will have variable pid, replace it w constant for snapshotting
      // @ts-ignore
      _.find(result, { pids: String(MAIN_PID) }).pids = '111111111'

      // @ts-ignore
      snapshot(result)
    })
  })
})
