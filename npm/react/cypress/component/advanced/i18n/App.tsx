import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { LocalizedComponent } from './LocalizedComponent'

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LocalizedComponent count={15} name="SomeUserName" />
    </I18nextProvider>
  )
}
