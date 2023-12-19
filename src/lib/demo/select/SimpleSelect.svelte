<script lang="ts">
  import { Select, element } from '$lib/components/select/select.js';
  import { HighlightSvelte } from 'svelte-highlight';
  import github from 'svelte-highlight/styles/github';
  import { code } from './code.js';

  const {
    state: { isOpen, selected, filteredOptions },
    elements: { options, trigger, content },
  } = new Select([{ label: '⚫️ Backlog' }, { label: '🔵 In progress' }, { label: '🟢 Done' }]);
</script>

<svelte:head>
  {@html github}
</svelte:head>

<h2 class="text-xl">Simple select dropdown</h2>

<button
  use:element={trigger}
  class="w-fit border {$isOpen
    ? 'border-slate-500'
    : 'border-slate-300'} flex items-center gap-2 focus:outline-none focus:border-sky-600 rounded-md px-2 py-1"
>
  <span class="text-slate-600">{$selected.length > 0 ? $selected[0].label : 'Nothing selected'}</span>
</button>

{#if $isOpen}
  <div class="flex flex-col divide-y bg-white border border-slate-300 rounded shadow-md pb-1" use:element={content}>
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
<HighlightSvelte {code} class="text-sm rounded-md p-4 border border-slate-300" />
