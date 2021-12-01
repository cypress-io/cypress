<template>
  <Collapsible
    v-if="isOpen"
    lazy
    :initially-open="initiallyOpen"
    :disable="!canCollapse"
    class="rounded-t rounded-b outline-none overflow-hidden group"
    :class="[
      classes.alertClass,
      classes.headerClass,
      {[`hocus-default border-1 border-transparent rounded ${classes.ring}`]: canCollapse}]"
    height="300"
  >
    <template #target="{ open }">
      <div
        data-testid="alert-header"
        class="cursor-pointer grid grid-cols-1 group"
        :class="{

        }"
      >
        <AlertHeader
          :title="title"
          v-bind="classes"
          :header-class="canCollapse ? 'group-hocus:underline' : ''"
          :prefix-icon="prefix?.icon"
          :prefix-icon-class="open ? prefix?.classes + ' rotate-180' : prefix?.classes"
          :suffix-icon-aria-label="props.dismissible ? t('components.alert.dismissAriaLabel') : ''"
          :suffix-icon="props.dismissible ? DeleteIcon : null"
          data-testid="alert"
          class="rounded min-w-200px p-16px"
          @suffixIconClicked="toggle() && emits('suffixIconClicked')"
        >
          <template
            v-if="$slots.prefixIcon"
            #prefixIcon="slotProps"
          >
            <slot
              name="prefixIcon"
              v-bind="slotProps"
            />
          </template>
          <template
            v-if="$slots.suffixIcon"
            #suffixIcon="slotProps"
          >
            <slot
              name="suffixIcon"
              v-bind="slotProps"
            />
          </template>
        </AlertHeader>
        <div
          v-if="open"
          data-testid="alert-body-divider"
          class="mx-auto h-1px transform w-[calc(100%-32px)] translate-y-1px"
          :class="[classes.dividerClass]"
        />
      </div>
    </template>
    <div
      v-if="$slots.default"
      class="text-left p-16px"
      data-testid="alert-body"
    >
      <slot />
    </div>
  </Collapsible>
</template>

<script lang="ts">
export type AlertStatus = 'error' | 'warning' | 'info' | 'default' | 'success'

export type AlertClasses = {
  headerClass: string,
  suffixIconClass: string
  suffixButtonClass: string
  alertClass: string
  dividerClass: string
  ring: string
}
</script>

<script lang="ts" setup>
import { useToggle } from '@vueuse/core'
import AlertHeader from './AlertHeader.vue'
import DeleteIcon from '~icons/cy/delete_x16.svg'
import { computed, useSlots, FunctionalComponent, SVGAttributes } from 'vue'
import ChevronDown from '~icons/cy/chevron-down-small_x16.svg'
import { useI18n } from '@cy/i18n'
import Collapsible from './Collapsible.vue'

const { t } = useI18n()
const slots = useSlots()

const emits = defineEmits<{
  (eventName: 'suffixIconClicked'): void
}>()

const props = withDefaults(defineProps<{
  title?: string
  status?: AlertStatus
  icon?: FunctionalComponent<SVGAttributes, {}>,
  headerClass?: string,
  alertClass?: string,
  dismissible?: boolean
  collapsible?: boolean
}>(), {
  title: 'Alert',
  alertClass: undefined,
  status: 'info',
  icon: undefined,
  headerClass: undefined,
})

const alertStyles: Record<AlertStatus, AlertClasses> = {
  default: {
    headerClass: 'text-gray-800',
    suffixIconClass: 'icon-dark-gray-600',
    suffixButtonClass: 'text-gray-600',
    alertClass: 'bg-gray-100',
    dividerClass: 'bg-gray-300',
    ring: 'hocus:(ring-gray-200 border-gray-300)',
  },
  info: {
    headerClass: 'text-info-700',
    suffixIconClass: 'icon-dark-info-500',
    suffixButtonClass: 'text-info-500',
    alertClass: 'bg-info-100',
    dividerClass: 'bg-info-300',
    ring: 'hocus:(ring-info-200 border-info-300)',
  },
  warning: {
    headerClass: 'text-warning-500',
    suffixIconClass: 'icon-dark-warning-500',
    suffixButtonClass: 'text-warning-500',
    alertClass: 'bg-warning-100',
    dividerClass: 'bg-warning-300',
    ring: 'hocus:(ring-warning-200 border-warning-300)',
  },
  error: {
    headerClass: 'text-error-600',
    suffixIconClass: 'icon-dark-error-500',
    suffixButtonClass: 'text-error-500',
    alertClass: 'bg-error-100',
    dividerClass: 'bg-error-300',
    ring: 'hocus:(ring-error-200 border-error-300)',
  },
  success: {
    headerClass: 'text-success-600',
    suffixIconClass: 'icon-dark-success-500',
    suffixButtonClass: 'text-success-500',
    alertClass: 'bg-success-100',
    dividerClass: 'bg-success-300',
    ring: 'hocus:(ring-success-200 border-success-300)',
  },
}

const [isOpen, toggle] = useToggle(true)
const classes = computed(() => {
  return {
    ...alertStyles[props.status],
    headerClass: props.headerClass ?? alertStyles[props.status].headerClass,
    alertClass: props.alertClass ?? alertStyles[props.status].alertClass,
  }
})
const canCollapse = computed(() => slots.default && props.collapsible)
const initiallyOpen = computed(() => slots.default && !props.collapsible)

const prefix = computed(() => {
  if (props.icon) return { icon: props.icon }

  if (canCollapse.value) {
    return {
      icon: ChevronDown,
      classes: 'transition transform duration-150 w-16px h-16px',
    }
  }

  return {}
})
</script>
