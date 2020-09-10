import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'

interface LocalizedComponentProps {
  name: string
  count: number
}

export function LocalizedComponent({ name, count }: LocalizedComponentProps) {
  // See ./App.tsx for localization setup
  const { t } = useTranslation()

  return (
    <Trans
      i18nKey={count === 1 ? 'userMessagesUnread' : 'userMessagesUnread_plural'}
      count={count}
    >
      Hello <strong> {{ name }} </strong>, you have {{ count }} unread message{' '}
    </Trans>
  )
}
