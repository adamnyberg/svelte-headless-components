<script lang="ts">
  import { type OptionItem, Select } from '$lib/components/select/select.js';
  import { ChevronRight, Plus } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  export let option: OptionItem;
  export let kind: 'option' | 'search' | 'add' = 'option';
  export let search = '';
</script>

<div
  class="flex items-center justify-between min-w-[160px] gap-2 px-2 py-1 {option.active
    ? 'bg-slate-100 text-slate-950'
    : 'text-slate-500'}"
>
  <div class="flex gap-2">
    {#if option.type === 'select' && option.isMulti}
      <input
        type="checkbox"
        bind:checked={option.selected}
        on:click|preventDefault={() => {}}
        class="focus:border-indigo-500 accent-indigo-500 checked:bg-indigo-500 checked:focus:bg-indigo-500 hover:checked:bg-indigo-500 rounded border border-slate-600 bg-transparent focus:ring-transparent hover:cursor-pointer"
      />
    {/if}

    {#if option.data?.icon}
      <Icon src={option.data.icon} class="color-slate-900" size="20" />
    {/if}

    <div class="flex gap-1 items-center">
      {#if kind === 'add'}
        <Icon src={Plus} size="20" class="text-slate-400" />
        {#if option.label}
          <span>{option.label}</span>
          <Icon src={ChevronRight} size="20" class="text-slate-300" />
        {/if}
        <span class="text-slate-600">Add new:</span>
        <span>{search}</span>
      {:else}
        {#if kind === 'search'}
          {#each Select.getParentLabels(option) as label}
            <span class="text-slate-500">{label}</span>
            <span class="text-slate-300">/</span>
          {/each}
        {/if}

        <span>
          {option.label}
        </span>
      {/if}
    </div>
  </div>

  {#if option.type === 'select' && option.selected && !option.isMulti}
    <span>✓</span>
  {/if}

  {#if option.type === 'menu'}
    <span class="text-2xl text-slate-400 leading-6">▸</span>
  {/if}
</div>
