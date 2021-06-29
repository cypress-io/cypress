import { defineComponent, h, withDirectives, resolveDirective } from 'vue'
import styles from './Tooltip.module.scss'

const makeTooltip = (slots, content) => () => {
  if (!slots.default) { return }
  const tooltip = resolveDirective('tooltip') as any
  if (!slots.default) return
  const rootNodes = slots.default().map((n) => {
    return withDirectives(n, [[tooltip, { content: `<span class="${styles.tooltip}">${content}</span>`, html: true }]])
  })
  return rootNodes
}

export const Tooltip = defineComponent({
  props: {
    content: String
  },
  setup(props, { slots }) {
    return makeTooltip(slots, props.content)
  }
})

export const HotkeyTooltip = defineComponent({
  props: {
    hotkey: String,
    content: String,
  },
  setup(props, { slots }) {
    return makeTooltip(slots, `${props.content}<pre class="${styles.keyboardTooltip}">${props.hotkey}</pre>`)
  }
})

export default Tooltip
