<template>
  <div>
    <h3>We'll automatically rename your specs in this step — here's why:</h3>
    <ul class="list-disc pl-24px">
      <li>
        <span>
          We've changed the default spec folder from:
        </span>
        <Tag
          class="text-red-500"
          code
        >cypress/integration</Tag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <Tag
          class="text-jade-500"
          code
        >cypress/e2e</Tag>
      </li>
      <li>
        <span>
          We've changed the default spec file extension from:
        </span>
        <Tag
          class="text-red-500"
          code
        >[filename].spec.[ext]</Tag>
        <i-cy-arrow-right_x16 class="h-16px w-16px inline-block icon-dark-gray-300" />
        <Tag
          class="text-blue-500"
          code
        >[filename].cy.[ext]</Tag>
      </li>
      <li>
        <span>
          Since you're currently using a custom directory for the <Tag code>integrationFolder</Tag>, we'll temporarily be moving your specs back to the default directory.
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import Tag from '@cy/components/Tag.vue'

defineProps<{

}>()
</script>
