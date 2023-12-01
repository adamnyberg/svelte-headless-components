<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { OptionItem, Select } from '../../components/select/select.js';
  import { offset } from 'svelte-floating-ui/dom';
  import { createFloatingActions } from 'svelte-floating-ui';
  import Options from './Options.svelte';
  import SearchOptions from './SearchOptions.svelte';
  import { clickOutside, focusElement } from '../utils.js';

  const dispatch = createEventDispatcher<{ select: OptionItem; addOption: string; open: void; close: void }>();

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';

  onMount(() => {
    select.isOpen.subscribe((value) => {
      if (value) {
        dispatch('open');
      } else {
        if (buttonRef) {
          buttonRef.focus();
        }
        dispatch('close');
      }
    });

    select.onSelect.subscribe((option) => {
      dispatch('select', option);
    });
  });

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'bottom-start',
    middleware: [offset(4)],
  });

  let inputRef: HTMLInputElement;
  let buttonRef: HTMLButtonElement;
  let { isOpen, search, selected, filteredOptions, searchOptions } = select;
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
      ? 'border-slate-100'
      : 'border-transparent'} focus:outline-none focus:border-sky-600 hover:border hover:border-slate-300 rounded-md px-2 py-1"
  >
    {$selected.length > 0 ? $selected.map((option) => option.label).join(', ') : 'Nothing selected'}
  </button>

  {#if $isOpen}
    <div
      class="absolute flex flex-col divide-y bg-white border border-slate-300 rounded shadow-md pb-1"
      use:floatingContent
    >
      {#if showSearch || select.config.allowAdditions}
        <input
          type="text"
          class="bg-white outline-none px-2 rounded-t py-1"
          bind:this={inputRef}
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

      {#if $search && $searchOptions.length > 0}
        <div class="flex flex-col">
          <SearchOptions {select} options={$searchOptions} />
        </div>
      {/if}
    </div>
  {/if}
</div>
