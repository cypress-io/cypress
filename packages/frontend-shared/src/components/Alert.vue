<template>
  <div
    class="overflow-hidden rounded text-16px leading-24px"
    :class="typeDefinition.class"
  >
    <div
      class="flex items-center rounded p-16px"
    >
      <component
        :is="typeDefinition.icon"
        v-if="typeDefinition.icon"
        class="flex-shrink-0 h-16px w-16px mr-8px"
        :class="typeDefinition.iconClass"
      />
      <div
        v-if="slots.default"
        class="flex-grow"
      >
        <slot />
      </div>
      <p
        v-else
        class="flex-grow"
      >
        {{ title }}
      </p>
      <button
        v-if="props.closeButton"
        aria-label="Close"
        class="border rounded-full p-5px hocus:outline-none"
        :class="typeDefinition.closeButtonClass"
        @click="emit('close')"
      >
        <i-cy-delete_x12
          class="w-12px h-12px m-4px"
          :class="typeDefinition.iconClass"
        />
      </button>
    </div>
    <div
      v-if="slots.details"
      :class="typeDefinition.detailsClass"
    >
      <slot name="details" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, FunctionalComponent, SVGAttributes, useSlots } from 'vue'
import ErrorIcon from '~icons/cy/errored-outline_x16.svg'
import SuccessIcon from '~icons/cy/circle-check_x16.svg'
import Button from './Button.vue'

export type AlertType = 'default' | 'error' | 'warning' | 'success' | 'info'

const props = withDefaults(defineProps<{
  type?: AlertType,
  title?: string,
  icon?: FunctionalComponent<SVGAttributes>,
  iconClass?: string,
  detailsClass?: string,
  closeButton?: boolean,
}>(), {
  type: 'default',
  title: '',
  icon: undefined,
  iconClass: undefined,
  detailsClass: undefined,
})

const emit = defineEmits<{
  (event: 'close'): void,
}>()

const typeDefinition = computed(() => {
  const def = typeDefs[props.type]

  if (props.icon) {
    def.icon = props.icon
  }

  if (props.iconClass) {
    def.iconClass = props.iconClass
  }

  if (props.detailsClass) {
    def.detailsClass = props.detailsClass
  }

  return def
})

const slots = useSlots()

const typeDefs: Record<AlertType, {
  class: string,
  iconClass?: string,
  icon?: FunctionalComponent<SVGAttributes>
  detailsClass?: string,
  closeButtonClass?: string
}> = {
  error: {
    class: 'bg-error-100 text-error-600',
    icon: ErrorIcon,
    iconClass: 'icon-dark-error-500',
    detailsClass: 'bg-error-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-error-400',
  },
  warning: {
    class: 'bg-warning-100 text-warning-600',
    icon: ErrorIcon,
    iconClass: 'icon-dark-warning-500',
    detailsClass: 'bg-warning-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-warning-400',
  },
  success: {
    class: 'bg-success-100 text-success-600',
    icon: SuccessIcon,
    iconClass: 'icon-dark-success-500',
    detailsClass: 'bg-success-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-success-400',
  },
  info: {
    class: 'bg-blue-100 text-blue-600',
    detailsClass: 'bg-blue-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-blue-400',
  },
  default: {
    class: 'bg-gray-100 text-gray-700',
    detailsClass: 'bg-gray-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-gray-400',
  },
}
</script>
