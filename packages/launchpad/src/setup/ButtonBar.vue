<template>
  <div class="border-t rounded-b flex bg-gray-50 border-t border-t-gray-100 py-[16px] px-[24px] gap-3">
    <slot>
      <Button
        v-if="nextFn"
        size="lg"
        :disabled="!canNavigateForward"
        :variant="mainVariant"
        @click="nextFn"
      >
        <template
          v-if="mainVariant === 'pending'"
          #prefix
        >
          <i-cy-loading_x16
            v-if="mainVariant === 'pending'"
            class="animate-spin icon-dark-white icon-light-gray-400"
          />
        </template>
        {{ next }}
      </Button>
      <Button
        v-if="backFn"
        size="lg"
        variant="outline"
        @click="backFn"
      >
        {{ back }}
      </Button>
      <div class="grow" />
      <div
        v-if="altFn && alt"
        class="flex px-3 items-center"
      >
        <label
          for="altFn"
          class="px-3 text-gray-500"
          @click="handleAlt"
        >
          {{ alt }}
        </label>
        <Switch
          size="lg"
          name="altFn"
          :value="altValue"
          @update="handleAlt"
        />
      </div>
      <Button
        v-if="skipFn"
        size="lg"
        variant="text"
        class="text-gray-500"
        @click="skipFn"
      >
        {{ skip }}
        <i-cy-arrow-right_x16 class="inline-block h-[16px] w-[16px] icon-dark-gray-500" />
      </Button>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { ButtonVariants } from '@cy/components/Button.vue'
import Button from '@cy/components/Button.vue'
import Switch from '@cy/components/Switch.vue'

const props = withDefaults(defineProps<{
  next?: string
  back?: string
  skip?: string
  nextFn?: () => void
  backFn?: () => void
  skipFn?: () => void
  alt?: string
  altFn?: (value: boolean) => void
  canNavigateForward?: boolean
  mainVariant?: ButtonVariants
}>(), {
  alt: undefined,
  altFn: undefined,
  next: undefined,
  back: undefined,
  skip: undefined,
  backFn: undefined,
  nextFn: undefined,
  skipFn: undefined,
  mainVariant: 'primary',
})

const altValue = ref(false)

const handleAlt = () => {
  altValue.value = !altValue.value
  props.altFn?.(altValue.value)
}
</script>
