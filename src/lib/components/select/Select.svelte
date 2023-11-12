<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { filterInput, type SelectClasses, type SelectComponents, type SelectOption } from './select.js';
  import { fade, type TransitionConfig } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ select: SelectOption; open: void; close: void; addText: string }>();

  export let components: SelectComponents;

  export let options: SelectOption[] = [];
  export let isOpen = false;
  export let isMulti = false;
  export let showSearch = false;
  export let allowAddText = false;
  export let inputPlaceholder = 'Search...';
  export let closeOnClickOutside = true;
  export let minAddTextLength = 2;

  export let transitionFn: (node: Element, params: any) => TransitionConfig = fade;
  export let transitionOptions: TransitionConfig = { duration: 100 };

  export let classes: SelectClasses = {};

  function selectOption(option: SelectOption) {
    option.selected = isMulti ? !option.selected : true;

    options = options.map((mapOption) => {
      if (mapOption.value === option.value) {
        return option;
      }

      if (!isMulti) {
        mapOption.selected = false;
        mapOption.active = false;
      }

      return mapOption;
    });

    if (!isMulti) {
      isOpen = false;
    }

    dispatch('select', option);
  }

  function getActiveOption(options: SelectOption[], addText: boolean) {
    if (addText) {
      return 'addText';
    }

    return options.find((option) => option.active);
  }
  function setActiveOption(option: SelectOption | 'addText' | undefined) {
    if (option === 'addText') {
      isAddTextActive = true;
    } else {
      isAddTextActive = false;
    }

    if (option === undefined || option === 'addText') {
      options = options.map((mapOption) => {
        mapOption.active = false;
        return mapOption;
      });
    } else {
      options = options.map((mapOption) => {
        if (mapOption.value === option.value) {
          mapOption.active = true;
        } else {
          mapOption.active = false;
        }
        return mapOption;
      });
    }

    console.log('setActiveOption', option, options);
  }

  function getActiveIndex(options: SelectOption[], addText: boolean) {
    if (addText) {
      return 'addText';
    }

    return options.findIndex((option) => option.active);
  }

  function open() {
    let option = options.find((option) => option.selected);
    console.log('open:option', option);

    if (option) {
      setActiveOption(option);
    } else if (options[0]) {
      console.log('setting new activeOption', options[0]);
      setActiveOption(options[0]);
    } else {
      console.log('activeOption undefined');
      setActiveOption(undefined);
    }

    dispatch('open');
  }

  function close() {
    options = options.map((option) => {
      option.active = false;
      return option;
    });
    setActiveOption(undefined);
    inputText = '';
    if (buttonRef) {
      buttonRef.focus();
    }
    dispatch('close');
  }

  function onOpenChange(isOpenValue: boolean) {
    if (isOpenValue) {
      open();
    } else {
      close();
    }
  }

  function onInputChange(inputTextValue: string) {
    if (!isOpen || !inputTextValue) {
      return;
    }
    console.log('onInputChange', inputTextValue);
    // update active option
    const filteredOptions = options.filter((option) => filterInput(inputTextValue, option));
    if (filteredOptions.find((option) => option.active) === undefined) {
      if (filteredOptions[0] !== undefined) {
        setActiveOption(filteredOptions[0]);
      } else if (allowAddText) {
        setActiveOption('addText');
      }
    }
  }

  function onButtonClick() {
    isOpen = !isOpen;
  }

  function onAddTextButtonClick() {
    console.log('onAddTextButtonClick', inputText);
    isAddTextActive = false;
    dispatch('addText', inputText);
    inputText = '';
  }

  function focusElement(node: HTMLElement) {
    if (node) {
      node.focus();
    }
  }

  function goDown() {
    console.log('goDown');
    const activeIndex = getActiveIndex(filteredOptions, isAddTextActive);
    if (activeIndex === 'addText') {
      return;
    }

    if (activeIndex >= filteredOptions.length - 1) {
      if (showAddTextButton) {
        setActiveOption('addText');
      }
      return;
    }

    const nextOption = filteredOptions[activeIndex + 1];
    if (nextOption) {
      setActiveOption(nextOption);
    }
  }

  function goUp() {
    console.log('goUp');
    const activeIndex = getActiveIndex(filteredOptions, isAddTextActive);
    if (activeIndex === 'addText') {
      if (filteredOptions.length > 0) {
        setActiveOption(filteredOptions[filteredOptions.length - 1]);
      }
      return;
    }

    if (activeIndex <= 0) {
      return;
    }
    const prevOption = filteredOptions[activeIndex - 1];
    setActiveOption(prevOption);
  }

  function onKeyUp(event: KeyboardEvent) {
    console.log('onKeyUp', event);
    if (isOpen) {
      const activeOption = getActiveOption(filteredOptions, isAddTextActive);
      console.log('onKeyUp', event.key, activeOption, filteredOptions);

      if (!activeOption) {
        console.log('No active option');
        return;
      }

      switch (event.code) {
        case 'Escape':
          console.log('Escape');
          isOpen = false;
          break;

        case 'Enter':
          console.log('Enter');

          if (activeOption === 'addText') {
            onAddTextButtonClick();
          } else {
            selectOption(activeOption);
          }
          break;

        case 'ArrowDown':
          console.log('ArrowDown');
          goDown();
          break;

        case 'ArrowUp':
          console.log('ArrowUp');
          goUp();
          break;

        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            console.log('Tab shift');
            goUp();
          } else {
            console.log('Tab');
            goDown();
          }
          break;
      }
    } else {
      switch (event.key) {
        case 'Enter':
          console.log('Enter');
          if (document.activeElement === buttonRef) {
            onButtonClick();
          }
          break;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    console.log('onKeyDown', event);
    if (isOpen) {
      switch (event.code) {
        case 'Tab':
          console.log('Prevent Tab');
          event.preventDefault();
          break;
      }
    }
  }

  onMount(() => {
    if (options.length === 0) {
      console.warn('No options provided');
      return;
    }

    const selected = options.find((option) => option.selected);
    if (!selected && !isMulti) {
      options[0].selected = true;
    }

    if (closeOnClickOutside) {
      window.addEventListener('click', (event) => {
        if (selectRef && !selectRef.contains(event.target as Node)) {
          isOpen = false;
        }
      });
    }

    buttonRef.addEventListener('mouseup', (event) => {
      console.log('buttonRef mouseup');
      onButtonClick();
    });
  });

  let selectRef: HTMLDivElement;
  let inputRef: HTMLInputElement;
  let buttonRef: HTMLButtonElement;

  let inputText = '';
  let isAddTextActive = false;

  let filteredOptions: SelectOption[] = [];
  // let activeOption: SelectOption | 'addText' | undefined = getActiveOption(filteredOptions, allowAddText);

  $: selected = options.filter((option) => option.selected);
  $: onOpenChange(isOpen);
  $: onInputChange(inputText);
  $: showInput = showSearch || allowAddText;
  $: showAddTextButton = allowAddText && inputText.length >= minAddTextLength;
  $: filteredOptions = options.filter((option) => filterInput(inputText, option));
</script>

<svelte:window on:keyup|preventDefault={onKeyUp} on:keydown={onKeyDown} />

<div bind:this={selectRef} class={classes.select ?? ''}>
  <svelte:component this={components.button} bind:ref={buttonRef} {selected} {isOpen} />
  {#if isOpen}
    <div transition:transitionFn={transitionOptions} class={classes.dropdown ?? ''}>
      {#if showInput}
        <div class={classes.inputDiv ?? ''}>
          <input
            type="text"
            bind:this={inputRef}
            bind:value={inputText}
            class={classes.input ?? ''}
            placeholder={inputPlaceholder}
            spellcheck="false"
            autocomplete="off"
            use:focusElement
          />
        </div>
      {/if}

      {#each filteredOptions as option}
        <button
          on:mouseenter={() => setActiveOption(option)}
          class={classes.itemButton ?? ''}
          on:click={() => selectOption(option)}
        >
          <svelte:component this={components.item} {option} />
        </button>
      {/each}

      {#if showAddTextButton}
        <svelte:component
          this={components.addTextButton}
          on:click={onAddTextButtonClick}
          on:mouseenter={() => setActiveOption('addText')}
          {inputText}
          isActive={isAddTextActive}
        />
      {/if}
    </div>
  {/if}
</div>
