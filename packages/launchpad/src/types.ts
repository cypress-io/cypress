import type { PropType, defineComponent, FunctionalComponent, SVGAttributes } from 'vue'

export type IconType = PropType<ReturnType<typeof defineComponent> & FunctionalComponent<SVGAttributes, {}>>
