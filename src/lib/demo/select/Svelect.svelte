<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AddOption, OptionItem, Select } from '$lib/components/select/select.js';
  import { offset } from 'svelte-floating-ui/dom';
  import { createFloatingActions } from 'svelte-floating-ui';
  import Options from '$lib/demo/select/Options.svelte';
  import SearchOptions from '$lib/demo/select/SearchOptions.svelte';
  import AddOptions from '$lib/demo/select/AddOptions.svelte';
  import { clickOutside, focusElement } from '../utils.js';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ChevronUpDown } from '@steeze-ui/heroicons';

  const dispatch = createEventDispatcher<{ select: OptionItem; add: AddOption; open: void; close: void }>();

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'bottom-start',
    middleware: [offset(4)],
  });
  let buttonRef: HTMLButtonElement;

  let {
    state: { isOpen, search, selected, filteredOptions, searchOptions, additionOptions },
    events: { onSelect, onAdd },
    config,
  } = select;

  $: if (buttonRef) {
    if ($isOpen) {
      buttonRef.blur();
      dispatch('open');
    } else {
      buttonRef.focus();
      dispatch('close');
    }
  }

  $: if ($onSelect) {
    dispatch('select', $onSelect);
  }

  $: if ($onAdd) {
    dispatch('add', $onAdd);
  }
</script>

<svelte:window
  on:keyup={(e) => {
    if (document.activeElement === buttonRef && e.key === 'Enter') {
      select.toggleIsOpen();
    } else {
      select.onKeyUp(e);
    }
  }}
  on:keydown={select.onKeyDown.bind(select)}
/>

<div
  class="w-fit"
  use:clickOutside={() => {
    select.close();
  }}
>
  <button
    bind:this={buttonRef}
    use:floatingRef
    on:mouseup={() => {
      select.toggleIsOpen();
    }}
    class="border {$isOpen
      ? 'border-slate-500'
      : 'border-slate-300'} flex items-center gap-2 focus:outline-none focus:border-sky-600 hover:border hover:border-slate-400 rounded-md px-2 py-1"
  >
    {#if $selected.length === 0}
      <span class="text-slate-500">Nothing selected</span>
    {:else}
      {#each $selected as option}
        {#if option.data?.icon}
          <Icon src={option.data.icon} class="color-slate-900" size="20" />
        {/if}
        {option.label}
        {#if $selected.length > 1 && $selected[$selected.length - 1] !== option}
          <span class="text-slate-300">|</span>
        {/if}
      {/each}
    {/if}
    <Icon src={ChevronUpDown} class="color-slate-900" size="20" />
  </button>

  {#if $isOpen}
    <div
      class="absolute flex flex-col divide-y bg-white border border-slate-300 rounded shadow-md pb-1"
      use:floatingContent
    >
      {#if showSearch || select.config.additions.length > 0}
        <input
          type="text"
          class="bg-white outline-none px-2 rounded-t py-1"
          bind:value={$search}
          placeholder={inputPlaceholder}
          spellcheck="false"
          autocomplete="off"
          use:focusElement
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
            <SearchOptions {select} options={$searchOptions} />
          </div>
        {/if}
        {#if config.additions.length > 0}
          <div class="flex flex-col">
            <AddOptions {select} options={$additionOptions} />
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
