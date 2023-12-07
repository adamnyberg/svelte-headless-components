export const code = `<script lang="ts">
import { Select, element } from '$lib/components/select/select.js';
import { offset } from '@floating-ui/core';
import { createFloatingActions } from 'svelte-floating-ui';

const [floatingRef, floatingContent] = createFloatingActions({
  strategy: 'absolute',
  placement: 'bottom-start',
  middleware: [offset(4)],
});

const select = new Select([
  { label: '⚫️ Backlog' },
  { label: '🔵 In progress' },
  { label: '🟢 Done' }]);
const {
  state: { isOpen, selected, filteredOptions },
  elements: { trigger, content, options },
} = select;
</script>

<div class="w-fit">
<button
  use:floatingRef
  use:element={trigger}
  class="border {$isOpen
    ? 'border-slate-500'
    : 'border-slate-300'} flex items-center gap-2 focus:outline-none focus:border-sky-600 hover:border hover:border-slate-400 rounded-md px-2 py-1"
>
  {#if $selected.length === 0}
    <span class="text-slate-500">Nothing selected</span>
  {:else}
    <span class="text-slate-900">{$selected[0].label}</span>
  {/if}
</button>

{#if $isOpen}
  <div
    class="flex flex-col divide-y bg-white border border-slate-300 rounded shadow-md pb-1"
    use:floatingContent
    use:element={content}
  >
    <div class="flex flex-col">
      {#each $filteredOptions as option}
        <button
          use:element={[options, option.id]}
          class="flex px-3 py-1 {option.active ? 'bg-slate-100 text-slate-950' : 'text-slate-500'}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
{/if}
</div>
`;
