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
      <div class="column controls-wrapper">
        <div class="controls">
          <slot name="controls"></slot>
        </div>      
      </div>
    </slot>
  </header>
</template>

<style scoped lang="scss">
header {
  display: flex;
  flex-direction: row;
  position: relative;
  grid-gap: 1px;
  justify-content: center;
  flex-wrap: wrap;
  height: 100%;
  background: var(--header-gap-color, gray);
}

.runnable-wrapper, .duration-wrapper, .controls-wrapper {
  flex-grow: 1;
}

.duration-wrapper {
  flex-shrink: 2;
}

.runnable-stats {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  grid-gap: 0.5rem;
}

.controls {
  display: flex;
  justify-content: flex-end;
  grid-gap: 0.75rem;
  width: 100%;
}

.column {
  padding: 0 0.5rem;
  height: auto;
  text-align: center;
  background: white;
  display: grid;
  align-content: center;
}

</style>