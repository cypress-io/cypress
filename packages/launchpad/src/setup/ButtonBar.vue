<template>
  <div class="border-t rounded-b flex bg-gray-50 border-t-1 border-t-gray-100 py-16px px-24px gap-3">
    <slot>
      <Button
        v-if="nextFn"
        size="lg"
        :disabled="!canNavigateForward"
        @click="nextFn"
      >
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
      <div class="flex-grow" />
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
    </slot>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@cy/components/Button.vue'
import Switch from '@cy/components/Switch.vue'

const props = withDefaults(defineProps<{
  next?: string
  back?: string
  nextFn?: () => void
  backFn?: () => void
  alt?: string
  altFn?: (value: boolean) => void
  canNavigateForward?: boolean
}>(), {
  alt: undefined,
  altFn: undefined,
  next: undefined,
  back: undefined,
  backFn: undefined,
  nextFn: undefined,
})

const altValue = ref(false)

const handleAlt = () => {
  altValue.value = !altValue.value
  props.altFn?.(altValue.value)
}
</script>
