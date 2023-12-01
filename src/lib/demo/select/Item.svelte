<script lang="ts">
  import { Select, type OptionItem } from '$lib/components/select/select.js';

  export let option: OptionItem;
  export let isSearch = false;
</script>

<div class="flex items-center justify-between min-w-[160px] gap-2 px-2 py-1 {option.active ? 'bg-slate-100' : ''}">
  <div class="flex gap-2">
    {#if option.type === 'select' && option.isMulti}
      <input
        type="checkbox"
        bind:checked={option.selected}
        class="focus:border-indigo-500 accent-indigo-500 checked:bg-indigo-500 checked:focus:bg-indigo-500 hover:checked:bg-indigo-500 rounded border border-slate-600 bg-transparent focus:ring-transparent hover:cursor-pointer"
      />
    {/if}

    <div class="text-slate-700 flex gap-2">
      {#if isSearch}
        {#each Select.getParentLabels(option) as label}
          <span class="text-slate-500">{label}</span>
          <span class="text-slate-300">/</span>
        {/each}
      {/if}
      <span>
        {option.label}
      </span>
    </div>
  </div>

  {#if option.type === 'select' && option.selected && !option.isMulti}
    <span>✓</span>
  {/if}

  {#if option.type === 'menu'}
    <span class="text-2xl text-slate-400 leading-6">▸</span>
  {/if}
</div>
