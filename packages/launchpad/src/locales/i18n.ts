import { createI18n as _createI18n } from 'vue-i18n'
import messages from '@intlify/vite-plugin-vue-i18n/messages'
import type enUS from '../../src/locales/en-US.json'

export type MessageSchema = typeof enUS

export const VueI18n = createI18n()

export function createI18n (opts = {}) {
  return _createI18n<MessageSchema, 'en-US'>({
    locale: 'en-US',
    messages,
    ...opts,
  })
}
