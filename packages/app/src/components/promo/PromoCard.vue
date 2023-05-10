<template>
  <div class="w-full">
    <!-- Small viewport layout -->
    <div class="flex flex-col lg:hidden p-[40px] gap-[16px]">
      <div>
        <h2 class="text-xl font-semibold">
          {{ title }}
        </h2>
        <p>{{ body }}</p>
        <slot name="content" />
      </div>
      <div>
        <slot name="image" />
      </div>
      <div>
        <slot name="action" />
      </div>
    </div>
    <!-- Large viewport layout -->
    <div class="hidden lg:visible lg:flex lg:flex-row lg:py-[64px] lg:px-[72px] gap-[32px] justify-between">
      <div class="flex flex-col flex-auto basis-1/2 justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            {{ title }}
          </h2>
          <p>{{ body }}</p>
        </div>
        <div>
          <slot name="action" />
        </div>
      </div>
      <div class="flex-auto basis-1/2">
        <slot name="image" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
  body: string
}>()

</script>
