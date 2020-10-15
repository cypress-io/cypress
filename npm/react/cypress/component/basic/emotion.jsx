// https://emotion.sh/docs/introduction
/** @jsx jsx */
import { css, jsx } from '@emotion/core'

// several Emotion examples

export const Emotion = () => {
  return (
    <div
      css={{
        color: 'hotpink',
      }}
    >
      Emotion 😈
    </div>
  )
}

export const Emotion2 = () => {
  return (
    <div
      css={css`
        padding: 22px;
        background-color: hotpink;
        font-size: 24px;
        border-radius: 4px;
        color: blue;
      `}
    >
      Blue on pink.
    </div>
  )
}
