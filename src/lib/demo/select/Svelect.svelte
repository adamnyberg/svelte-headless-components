<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { OptionItem, Select } from '../../components/select/select.js';
  import { offset } from 'svelte-floating-ui/dom';
  import { createFloatingActions } from 'svelte-floating-ui';
  import Options from './Options.svelte';
  import { clickOutside, focusElement } from '../utils.js';

  const dispatch = createEventDispatcher<{ select: OptionItem; addOption: string; open: void; close: void }>();

  export let select: Select;
  export let showSearch = false;
  export let inputPlaceholder = 'Search...';

  // function onInputChange(inputTextValue: string) {
  //   if (!isOpen || !inputTextValue) {
  //     return;
  //   }
  //   console.log('onInputChange', inputTextValue);
  //   // update active option
  //   const filteredOptions = filterInput(options, inputTextValue);
  //   const activeOption = getActiveOption(filteredOptions, isAddTextActive);
  //   if (activeOption === undefined) {
  //     const selectOptions = getSelectOptionsFlat(filteredOptions);
  //     if (selectOptions[0] !== undefined) {
  //       setActiveOption(selectOptions[0]);
  //     } else if (allowAddText) {
  //       setActiveOption('addText');
  //     }
  //   }
  // }

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
  });

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'bottom-start',
    middleware: [offset(4)],
  });

  let inputRef: HTMLInputElement;
  let buttonRef: HTMLButtonElement;

  let { isOpen, search, selected, options } = select;

  $: console.log('options', $options);
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
    <div class="absolute flex flex-col bg-white border border-slate-300 rounded shadow-md pb-1" use:floatingContent>
      {#if showSearch || select.config.additions}
        <div class="">
          <input
            type="text"
            class="bg-white border-solid border outline-none px-2 rounded-t py-1"
            bind:this={inputRef}
            bind:value={$search}
            placeholder={inputPlaceholder}
            spellcheck="false"
            autocomplete="off"
            use:focusElement
          />
        </div>
      {/if}

      <Options {select} options={$options} />
    </div>
  {/if}
</div>
