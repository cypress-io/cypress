<template>
  <div
    data-cy="runsSkeletonRow"
    class="p-[16px] gap-[16px] flex justify-between children:flex"
  >
    <div class="overflow-hidden gap-[8px] children:rounded-lg children:h-[26px] children:bg-gray-50">
      <div
        class="shrink-0 w-[80px]"
      />
      <div
        class="w-[160px] max-w-[160px]"
      />
      <div
        class="w-[80px] max-w-[80px]"
      />
      <div
        class="w-[80px] max-w-[80px]"
      />
    </div>
    <div class="children:flex  children:items-center overflow-hidden gap-[16px] children:overflow-hidden children:gap-[8px]">
      <div class="children:bg-gray-50 children:rounded-lg">
        <div
          class="shrink-0 w-[16px] h-[16px]"
        />
        <div
          class="w-[80px] max-w-[80px] h-[20px]"
        />
      </div>
      <div class="children:bg-gray-50 children:rounded-lg">
        <div
          class="shrink-0 w-[16px] h-[16px]"
        />
        <div
          class="w-[120px] max-w-[120px] h-[20px]"
        />
      </div>
    </div>
  </div>
</template>
