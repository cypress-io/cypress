<template>
  <div
    class="
      px-5
      py-5
      flex
      gap-3
      bg-gray-50
      border-t border-t-1 border-t-gray-200
      rounded-b
    "
  >
    <Button v-if="showNext" @click="nextFn" :disabled="!canNavigateForward">{{ next }}</Button>
    <Button @click="backFn" variant="outline">{{ back }}</Button>
    <div class="flex-grow" />
    <div v-if="altFn && alt" class="flex items-center px-3">
      <label @click="handleAlt" class="text-gray-500 px-3">{{ alt }}</label>
      <Switch :value="altValue" @update="handleAlt" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import Button from "../components/button/Button.vue";
import Switch from "../components/switch/Switch.vue";

const props = withDefaults(
  defineProps<{
  next: string
  back: string
  nextFn: () => void
  backFn: () => void
  alt?: string
  altFn?: (value: boolean) => void
  canNavigateForward?: boolean
  showNext: boolean
}>(), {
  showNext: true 
})

const altValue = ref(false);

const handleAlt = () => {
  altValue.value = !altValue.value
  props.altFn?.(altValue.value);
}

</script>
