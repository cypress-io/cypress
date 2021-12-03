<template>
  <div
    class="rounded text-16px leading-24px overflow-hidden"
    :class="typeDefinition.class"
  >
    <div
      class="rounded flex p-16px items-center"
    >
      <component
        :is="typeDefinition.icon"
        v-if="typeDefinition.icon"
        class="flex-shrink-0 h-16px mr-8px w-16px"
        :class="typeDefinition.iconClass"
      />
      <div
        class="flex-grow"
      >
        <slot>
          {{ title }}
        </slot>
      </div>

      <button
        v-if="props.dismissible"
        aria-label="Close"
        class="border rounded-full p-5px hocus:outline-none"
        :class="typeDefinition.closeButtonClass"
        @click="emit('dismiss')"
      >
        <i-cy-delete_x12
          class="h-12px m-4px w-12px"
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
    <hr
      v-if="props.stackTrace && slots.details"
      class="border-error-200"
    >
    <div
      v-if="props.stackTrace"
      :class="typeDefinition.detailsClass"
    >
      <button
        class="flex gap-8px items-center hocus:outline-none"
        @click="stackOpen = !stackOpen"
      >
        <i-cy-chevron-right_x16
          class="h-16px w-16px icon-dark-error-400"
          :class="stackOpen ? 'transform rotate-90': ''"
        />
        Stack Trace
      </button>
      <div
        v-if="stackOpen"
        class="rounded border-2px border-error-100 mt-16px relative"
      >
        <CopyButton
          class="bg-white m-16px top-0 right-0 absolute"
          :text="props.stackTrace"
          variant="outline"
        />
        <pre
          class="bg-white border rounded border-error-300 p-16px overflow-auto"
        >{{ props.stackTrace }}</pre>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, FunctionalComponent, ref, SVGAttributes, useSlots } from 'vue'
import ErrorIcon from '~icons/cy/status-errored-outline_x16.svg'
import SuccessIcon from '~icons/cy/circle-check_x16.svg'
import CopyButton from './CopyButton.vue'

export type AlertType = 'default' | 'error' | 'warning' | 'success' | 'info'

const props = withDefaults(defineProps<{
  type?: AlertType,
  title?: string,
  icon?: FunctionalComponent<SVGAttributes>,
  iconClass?: string,
  stackTrace?: string,
  detailsClass?: string,
  dismissible?: boolean,
}>(), {
  type: 'default',
  title: '',
  icon: undefined,
  iconClass: undefined,
  stackTrace: undefined,
  detailsClass: undefined,
})

const emit = defineEmits<{
  (event: 'dismiss'): void,
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

const stackOpen = ref(false)

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
    detailsClass: 'p-16px bg-error-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-error-400',
  },
  warning: {
    class: 'bg-warning-100 text-warning-600',
    icon: ErrorIcon,
    iconClass: 'icon-dark-warning-500',
    detailsClass: 'p-16px bg-warning-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-warning-400',
  },
  success: {
    class: 'bg-success-100 text-success-600',
    icon: SuccessIcon,
    iconClass: 'icon-dark-success-500',
    detailsClass: 'p-16px bg-success-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-success-400',
  },
  info: {
    class: 'bg-blue-100 text-blue-600',
    detailsClass: 'p-16px bg-blue-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-blue-400',
  },
  default: {
    class: 'bg-gray-100 text-gray-700',
    detailsClass: 'p-16px bg-gray-50 font-light',
    closeButtonClass: 'border-transparent hocus:border-gray-400',
  },
}
</script>
