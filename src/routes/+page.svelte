<script lang="ts">
  import Select from '$lib/components/select/Select.svelte';
  import type { SelectClasses } from '$lib/components/select/select.js';
  import Item from '$lib/demo/Item.svelte';
  import SelectButton from '$lib/demo/SelectButton.svelte';
  import AddTextButton from '$lib/demo/AddTextButton.svelte';

  const options = ['Stone', 'Branch', 'Flower', 'Grass'].map((label) => ({
    label,
    value: label,
    selected: false,
    active: false,
  }));

  let simpleOptions = [
    { value: null, label: 'No option', selected: false, active: false },
    ...structuredClone(options),
  ];

  let multiOptions = structuredClone(options);

  const baseStyle: SelectClasses = {
    select: 'relative',
    dropdown: 'absolute z-10 bg-white flex flex-col border rounded border-gray-400 shadow-md py-1',
    input: 'bg-white border-solid border outline-none px-2',
  };
  const components = {
    item: Item,
    button: SelectButton,
    addTextButton: AddTextButton,
  };
</script>

<div class="flex flex-col max-w-2xl gap-12 m-auto mt-12 mb-6">
  <h1 class="text-3xl">Svelte Headless Components</h1>

  <div>
    <h2 class="text-xl">Allow add option</h2>
    <Select
      {components}
      bind:options={simpleOptions}
      on:close={() => console.log('on:close')}
      on:open={() => console.log('on:open')}
      on:select={({ detail }) => console.log('on:select', detail)}
      on:addText={({ detail }) => {
        console.log('on:addText', detail);
        simpleOptions = [
          ...simpleOptions.map((option) => {
            option.selected = false;
            return option;
          }),
          { label: detail, value: detail, selected: true, active: false },
        ];
      }}
      classes={baseStyle}
      inputPlaceholder="Search or add..."
      allowAddText
    />
  </div>

  <div>
    <h2 class="text-xl">Multi select</h2>
    <Select
      {components}
      bind:options={multiOptions}
      on:close={() => console.log('on:close')}
      on:open={() => console.log('on:open')}
      on:select={({ detail }) => console.log('on:select', detail)}
      on:addText={({ detail }) => {
        console.log('on:addText', detail);
        multiOptions = [
          ...multiOptions.map((option) => {
            option.active = false;
            return option;
          }),
          { label: detail, value: detail, selected: true, active: true },
        ];
      }}
      classes={baseStyle}
      isMulti
      allowAddText
    />
  </div>
</div>
