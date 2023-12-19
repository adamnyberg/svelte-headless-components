<script lang="ts">
  import { Select, type InputOptionItem } from '$lib/components/select/select.js';
  import Example from '$lib/demo/Example.svelte';
  import { ChartBar, ChartPie, PresentationChartLine } from '@steeze-ui/heroicons';
  import Svelect from '$lib/demo/select/Svelect.svelte';
  import { get } from 'svelte/store';
  import SimpleSelect from '$lib/demo/select/SimpleSelect.svelte';

  const options: InputOptionItem[] = [
    { label: 'Yellow bug' },
    { label: 'Cheetah' },
    {
      label: 'Colors',
      type: 'menu',
      subOptions: [{ label: '💙 Blue' }, { label: '💜 Purple' }, { label: '💛 Yellow' }, { label: '💚 Green' }],
    },
    {
      label: 'Pokemons',
      type: 'menu',
      subOptions: [
        {
          label: '💧 Water',
          type: 'menu',
          subOptions: [{ label: 'Squirtle' }, { label: 'Wartortle' }, { label: 'Blastoise' }],
        },
        {
          label: '🔥 Fire',
          type: 'menu',
          subOptions: [{ label: 'Charmander' }, { label: 'Charmeleon' }, { label: 'Charizard' }],
        },
        {
          label: '🌱 Grass',
          type: 'menu',
          subOptions: [{ label: 'Bulbasaur' }, { label: 'Ivysaur' }, { label: 'Venusaur' }],
        },
      ],
    },
    {
      label: 'Labels',
      type: 'menu',
      subOptions: [
        { label: 'Bug', isMulti: true },
        { label: 'Feature', isMulti: true },
        { label: 'Help', isMulti: true },
      ],
    },
  ];

  let config = {
    additions: [
      {
        id: 'add:colors',
        label: 'Colors',
      },
      {
        id: 'add:pokemons',
        label: 'Pokemons',
      },
    ],

    minSearchLength: 2,
  };

  const multiAddOptions = [
    { label: 'Bar chart', isMulti: true, data: { icon: ChartBar } },
    { label: 'Pie chart', isMulti: true, data: { icon: ChartPie } },
  ];

  const multiWithAdd = new Select(multiAddOptions, {
    additions: [
      {
        id: 'add:option',
        label: '',
      },
    ],
    minSearchLength: 2,
  });

  const selects = [
    new Select([
      { label: 'Bar chart', data: { icon: ChartBar } },
      { label: 'Pie chart', data: { icon: ChartPie } },
    ]),
    new Select([
      { label: 'Bar chart', isMulti: true, data: { icon: ChartBar } },
      { label: 'Pie chart', isMulti: true, data: { icon: ChartPie } },
      { label: 'Line chart', isMulti: true, data: { icon: PresentationChartLine } },
    ]),
    new Select(structuredClone(options), config),
  ];
</script>

<div class="flex justify-center">
  <div class="flex flex-col max-w-4xl gap-12 mt-12 px-4 mb-40">
    <h1 class="text-3xl flex justify-between items-center">
      <span>Svelte Headless Select Demo</span>
      <a href="https://github.com/adamnyberg/svelte-headless-components" class="text-sm text-slate-500">Github</a>
    </h1>
    <div class="flex flex-col gap-4">
      <p>Basic usage is to create an instance of the Select class and then use the exposed props to build your UI.</p>
      <p>
        The library is completely unstyled and you're free to structure your HTML however you want. Feel free to take
        inspiration from the <a
          class="text-indigo-500 hover:text-indigo-800"
          href="https://github.com/adamnyberg/svelte-headless-components/tree/main/src/lib/demo/select"
          >demo components</a
        > I created at .
      </p>
    </div>

    <SimpleSelect />
    <hr />

    <Example select={selects[2]} showSearch>All options with sub menus</Example>
    <Example select={selects[0]}>Select</Example>
    <Example select={selects[1]}>Multi select</Example>
    <div>
      <h2 class="text-xl">Multi with additions</h2>
      <Svelect
        select={multiWithAdd}
        showSearch
        inputPlaceholder="Search or add..."
        on:add={({ detail }) => {
          const newOption = Select.inputToOptionItem({ label: detail.searchText, isMulti: true, selected: true });
          const newOptions = [...get(multiWithAdd.state.options), newOption];
          multiWithAdd.inputOptions.set(newOptions);
          multiWithAdd.setActive(newOption);
        }}
      />
    </div>
  </div>
</div>
