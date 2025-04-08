import {
  useI18n as _useI18n,
  createI18n as _createI18n,
} from 'vue-i18n'

import type enUS from './en-US.json'
// Imports a special compiled messages object
import compiledMessages from '@intlify/unplugin-vue-i18n/messages'

// The raw strings for the default language (en) used for testing
import rawJsonMessages from './en-US.json?raw'

export type MessageSchema = typeof enUS

export const defaultMessages: MessageSchema = JSON.parse(rawJsonMessages)

export const VueI18n = createI18n()

export function createI18n (opts = {}) {
  return _createI18n<MessageSchema, 'en-US'>({
    locale: 'en-US',
    /**
    * precompiled messages from unplugin-vue-i18n do not include explicit keys derived from
    * the filenames of the raw message sources, so it must be coerced.
    */
    messages: compiledMessages as { 'en-US': MessageSchema },
    ...opts,
  })
}

export function useI18n () {
  return _useI18n<{ message: MessageSchema }>({ useScope: 'global' })
}
