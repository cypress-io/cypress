import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: {
          userMessagesUnread:
            'Hello <1>{{name}}</1>, you have {{count}} unread message.',
          userMessagesUnread_plural:
            'Hello <1>{{name}}</1>, you have {{count}} unread messages.',
        },
      },
      ru: {
        translation: {
          userMessagesUnread:
            'Привет, <1>{{name}}</1>, y тебя {{count}} непрочитанное сообщение.',
          userMessagesUnread_plural:
            'Привет, <1>{{name}}</1>, y тебя {{count}} непрочитанных сообщений.',
        },
      },
    },
    lng: 'en',
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
