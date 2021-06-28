<template>
  <header data-cy="reporter-header">
    <!-- Three stats (passed, failed, pending)-->
    <slot>
      <div class="column runnable-wrapper">
        <div class="runnable-stats">
          <slot name="runnables"></slot>
        </div>
      </div>

      <!-- Timer -->
      <div class="column duration-wrapper">
        <slot name="duration"></slot>
      </div>

      <!-- Controls (auto-scrolling and play-pause) -->
      <div class="column controls-wrapper justify-end">
        <div class="controls">
          <slot name="controls"></slot>
        </div>      
      </div>
    </slot>
  </header>
</template>

<style scoped lang="scss">
header {
  @apply flex flex-row relative gap-1px
    justify-center flex-wrap;
  height: 100%;
  background: var(--header-gap-color, gray);
}

.controls-wrapper {
  @apply flex-grow-[10];
}

.controls {
  @apply flex justify-end gap-0.75rem;
}

.duration-wrapper {
  @apply flex-grow-[1] flex-shrink-[1] min-w-48px;

}

.runnable-wrapper {
  @apply flex-grow-[2];
}

.runnable-stats {
  @apply flex flex-row flex-wrap justify-center align-center gap-0.5;
}


.column {
  @apply px-0.5rem h-auto text-center grid bg-white items-center;
}

</style>