<script lang="ts">
  import { element, type Select } from '$lib/components/select/select.js';
  import Options from '$lib/demo/select/Options.svelte';
  import Item from './Item.svelte';

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';

  let {
    state: { search, filteredOptions, searchOptions, additionOptions },
    elements: { search: searchElement, content },
    config,
  } = select;
</script>

<div class="flex flex-col divide-y bg-white border border-slate-300 rounded shadow-md pb-1 z-30" use:element={content}>
  {#if showSearch || select.config.additions.length > 0}
    <input
      type="text"
      class="bg-white outline-none px-2 rounded-t py-1"
      placeholder={inputPlaceholder}
      spellcheck="false"
      autocomplete="off"
      use:element={searchElement}
    />
  {/if}

  {#if $filteredOptions.length > 0}
    <div class="flex flex-col">
      <Options {select} options={$filteredOptions} />
    </div>
  {/if}

  {#if $search.length >= config.minSearchLength}
    {#if $searchOptions.length > 0}
      <div class="flex flex-col">
        {#each $searchOptions as option}
          <button use:element={[select.elements.options, option.id]}>
            <Item {option} kind="search" />
          </button>
        {/each}
      </div>
    {/if}

    {#if config.additions.length > 0}
      <div class="flex flex-col">
        {#each $additionOptions as option}
          <button use:element={[select.elements.options, option.id]}>
            <Item {option} kind="add" search={$search} />
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
