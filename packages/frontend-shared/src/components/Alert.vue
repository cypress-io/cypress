<template>
  <Collapsible
    v-if="modelValue"
    lazy
    :initially-open="initiallyOpen"
    :disable="!canCollapse"
    :overflow="overflow"
    class="rounded-t rounded-b outline-none group"
    :class="[
      classes.headerClass,
      {[`hocus-default border border-transparent rounded ${classes.ring}`]: canCollapse, 'overflow-hidden': overflow}]"
    :max-height="maxHeight"
  >
    <template #target="{ open }">
      <div
        data-cy="alert-header"
        class="grid grid-cols-1 group"
        :class="{
          'cursor-pointer': canCollapse,
        }"
      >
        <AlertHeader
          :title="title"
          :header-class="`${props.headerClass} ${canCollapse ? 'group-hocus:underline' : ''}`"
          :prefix-icon="prefix?.icon"
          :prefix-icon-class="(open && collapsible) ? prefix?.classes + ' rotate-180' : prefix?.classes"
          :suffix-icon-aria-label="props.dismissible ? t('components.alert.dismissAriaLabel') : ''"
          :suffix-icon="props.dismissible ? DeleteIcon : null"
          :suffix-button-class="classes.suffixButtonClass"
          :suffix-icon-class="classes.suffixIconClass"
          data-cy="alert"
          class="rounded min-w-[200px] p-[16px]"
          @suffixIconClicked="$emit('update:modelValue', !modelValue)"
        >
          <template
            v-if="$slots.title"
            #title
          >
            <slot
              name="title"
            />
          </template>
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
      </div>
    </template>
    <div
      v-if="$slots.default"
      class="text-left p-[16px]"
      data-cy="alert-body"
      :class="computedBodyClass"
    >
      <slot />
    </div>
  </Collapsible>
</template>

<script lang="ts">
export type AlertStatus = 'error' | 'warning' | 'info' | 'default' | 'success' | 'promo'

export type AlertClasses = {
  headerClass: string
  suffixIconClass: string
  suffixButtonClass: string
  bodyClass: string
  ring: string
}
</script>

<script lang="ts" setup>
import AlertHeader from './AlertHeader.vue'
import DeleteIcon from '~icons/cy/delete_x16.svg'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { computed, useSlots } from 'vue'
import ChevronDown from '~icons/cy/chevron-down-small_x16.svg'
import { useI18n } from '@cy/i18n'
import Collapsible from './Collapsible.vue'

const { t } = useI18n()
const slots = useSlots()

defineEmits<{
  (eventName: 'update:modelValue', value: boolean): void
}>()

const props = withDefaults(defineProps<{
  title?: string
  status?: AlertStatus
  icon?: FunctionalComponent<SVGAttributes, {}>
  headerClass?: string
  bodyClass?: string
  dismissible?: boolean
  collapsible?: boolean
  modelValue?: boolean
  iconClasses?: string
  maxHeight?: string
  overflow?: boolean
}>(), {
  title: undefined,
  modelValue: true,
  status: 'info',
  icon: undefined,
  headerClass: undefined,
  bodyClass: undefined,
  iconClasses: '',
  maxHeight: undefined,
  overflow: true,
})

const title = computed(() => props.title ?? 'Alert')

const alertStyles: Record<AlertStatus, AlertClasses> = {
  default: {
    headerClass: 'text-gray-800 bg-gray-100',
    suffixIconClass: 'icon-dark-gray-600',
    suffixButtonClass: 'text-gray-600',
    bodyClass: 'bg-gray-50',
    ring: 'hocus:ring-gray-200 hocus:border-gray-300',
  },
  info: {
    headerClass: 'text-info-700 bg-info-100',
    suffixIconClass: 'icon-dark-info-500',
    suffixButtonClass: 'text-info-500',
    bodyClass: 'bg-info-50',
    ring: 'hocus:ring-info-200 hocus:border-info-300',
  },
  warning: {
    headerClass: 'text-warning-600 bg-warning-100',
    suffixIconClass: 'icon-dark-warning-500',
    suffixButtonClass: 'text-warning-500',
    bodyClass: 'bg-warning-50',
    ring: 'hocus:ring-warning-200 hocus:border-warning-300',
  },
  error: {
    headerClass: 'text-error-600 bg-error-100',
    suffixIconClass: 'icon-dark-error-500',
    suffixButtonClass: 'text-error-500',
    bodyClass: 'bg-error-50',
    ring: 'hocus:ring-error-200 hocus:border-error-300',
  },
  success: {
    headerClass: 'text-success-600 bg-success-100',
    suffixIconClass: 'icon-dark-success-500',
    suffixButtonClass: 'text-success-500',
    bodyClass: 'bg-success-50',
    ring: 'hocus:ring-success-200 hocus:border-success-300',
  },
  promo: {
    headerClass: 'text-gray-900 bg-white border border-gray-100',
    suffixIconClass: 'icon-dark-gray-700',
    suffixButtonClass: 'text-gray-700',
    bodyClass: 'bg-white border-t border-gray-100',
    ring: 'hocus:ring-gray-100 hocus:border-gray-100',
  },
}

const classes = computed(() => {
  return {
    ...alertStyles[props.status],
    bodyClass: props.bodyClass ?? alertStyles[props.status].bodyClass,
    headerClass: props.headerClass ?? alertStyles[props.status].headerClass,
  }
})
const canCollapse = computed(() => slots.default && props.collapsible)
const initiallyOpen = computed(() => slots.default && !props.collapsible)

const prefix = computed(() => {
  if (props.icon) return { classes: props.iconClasses, icon: props.icon }

  if (canCollapse.value) {
    return {
      icon: ChevronDown,
      classes: 'transition transform duration-150 w-[16px] h-[16px]',
    }
  }

  return {}
})

const computedBodyClass = computed(() => {
  return `${classes.value.bodyClass} ${props.bodyClass}`
})
</script>
