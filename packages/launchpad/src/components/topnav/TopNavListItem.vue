<template>
    <li class="flex">
        <div v-if="hasPrefix" class="w-32">
            <slot name="prefix"></slot>
        </div>
        <div class="flex-grow">
            <slot>
                <a href="#">8.4.1</a>
                <br />Released 6 days ago
            </slot>
        </div>
        <div>
            <slot name="suffix"></slot>
        </div>
    </li>
</template>
<script setup lang="ts">
import { useSlots, computed } from "vue";
const slots = useSlots();

const hasPrefix = computed(() => {
  return Boolean(slots.prefix)
})

const hasSuffix = computed(() => {
  return Boolean(slots.suffix)
})

console.log(hasPrefix.value, hasSuffix.value)
</script>