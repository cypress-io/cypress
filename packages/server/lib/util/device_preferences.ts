import debugModule from 'debug'
import * as savedState from '../saved_state'
import { DevicePreferences, devicePreferenceDefaults } from '@packages/types/src/devicePreferences'

const debug = debugModule('cypress:server:preferences')

export async function setDevicePreference<K extends keyof DevicePreferences> (key: K, value: DevicePreferences[K]) {
  debug('set preference: %s: %s', key, value)

  const state = await savedState.create()

  state.set({ [key]: value })
}

export async function getDevicePreferences (): Promise<DevicePreferences> {
  const cached = await (await savedState.create()).get()

  const state = { ...devicePreferenceDefaults, ...cached }

  debug('get preferences: %o', state)

  return state
}
