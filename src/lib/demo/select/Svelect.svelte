<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { element, type AddOption, type OptionItem, type Select } from '$lib/components/select/select.js';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ChevronUpDown } from '@steeze-ui/heroicons';
  import Content from './Content.svelte';

  const dispatch = createEventDispatcher<{
    select: OptionItem;
    change: OptionItem;
    add: AddOption;
    open: void;
    close: void;
  }>();

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';

  let {
    state: { isOpen, selected },
    events: { onSelect, onChange, onAdd },
    elements: { trigger },
  } = select;

  $: if ($isOpen) {
    dispatch('open');
  } else {
    dispatch('close');
  }

  $: if ($onSelect) {
    dispatch('select', $onSelect);
  }

  $: if ($onChange) {
    dispatch('change', $onChange);
  }

  $: if ($onAdd) {
    dispatch('add', $onAdd);
  }
</script>

<div class="w-fit">
  <button
    use:element={trigger}
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
    <Content {select} {showSearch} {inputPlaceholder} />
  {/if}
</div>
