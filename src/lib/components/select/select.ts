import { get, writable, type Writable } from 'svelte/store';

type OptionBase = {
  id: string;
  label: string;
  active: boolean;
  parent: OptionMenu | null;
  data?: Record<string, any>;
};

export type OptionSelect = OptionBase & {
  type: 'select';
  selected: boolean;
  isAdd: boolean;
  isMulti: boolean;
};
export type InputSelectOption = Partial<Omit<OptionSelect, 'label'>> & Pick<OptionSelect, 'label'>;

export type OptionMenu = OptionBase & {
  type: 'menu';
  hasSelected: boolean;
  subOptions: OptionItem[];
};
export type InputMenuOption = Partial<Omit<OptionMenu, 'label' | 'subOptions'>> &
  Pick<OptionMenu, 'label'> & { subOptions: InputOptionItem[] };

export type CloseOnSelect = 'never' | 'always' | 'not_multi';
export type SelectConfig = {
  allowAdditions: boolean;
  closeOnSelect: CloseOnSelect;
};

export type OptionItem = OptionSelect | OptionMenu;

export type InputOptionItem = InputMenuOption | InputSelectOption;

const searchOptionPrefix = 'search';

export class Select {
  readonly inputOptions: Writable<OptionItem[]>;
  readonly filteredOptions: Writable<OptionItem[]>;
  readonly searchOptions: Writable<OptionSelect[]>;
  // readonly addOption: Writable<OptionSelect | null>;
  readonly selected: Writable<OptionSelect[]>;
  readonly onSelect: Writable<OptionSelect>;
  readonly isOpen = writable(false);
  search: Writable<string>;
  config: SelectConfig;

  constructor(
    inputOptions: InputOptionItem[],
    config: SelectConfig = { allowAdditions: false, closeOnSelect: 'not_multi' },
  ) {
    const options = inputOptions.map((option) => Select.inputToOptionItem(option));

    const selectOptions = Select.toFlatSelect(options);

    if (selectOptions.length === 0) {
      throw new Error('Select must have at least one option');
    }

    this.onSelect = writable();

    this.inputOptions = writable(options);
    this.filteredOptions = writable(options);
    this.searchOptions = writable([]);
    this.config = config;

    this.selected = writable([]);
    this.inputOptions.subscribe((options) => {
      const newSelected = Select.toFlatSelect(options).filter((option) => option.selected);
      this.selected.set(newSelected);
      this.updateFilteredOptions(options);
      // this.updateSearchOptions(options);
    });

    this.search = writable('');
    this.search.subscribe((search) => {
      this.onSearchChange(search);
    });
  }

  open(): void {
    const selected = get(this.selected);
    if (selected.length > 0) {
      this.setActive(selected[0]);
    } else {
      this.setFirstActive();
    }
    this.isOpen.set(true);
  }

  close(): void {
    this.search.set('');
    this.setActive(null);
    this.isOpen.set(false);
  }

  toggleIsOpen(): void {
    if (get(this.isOpen)) {
      this.close();
    } else {
      this.open();
    }
  }

  selectOption(id: string): OptionSelect | null {
    if (this.isSearchOptionId(id)) {
      id = id.split(':').at(-1) ?? '';
    }

    const option = this.getSelectOption(id);
    if (option === null) {
      return null;
    }

    if (!option.isMulti) {
      const optionsFlat = Select.toFlat(get(this.inputOptions));
      for (const o of optionsFlat) {
        if (o.type === 'select') {
          o.selected = false;
        } else {
          o.hasSelected = false;
        }
      }

      let parent = option.parent;
      while (parent) {
        parent.hasSelected = true;
        parent = parent.parent;
      }
    }

    option.selected = option.isMulti ? !option.selected : true;

    this.inputOptions.set(get(this.inputOptions));
    this.updateSearchOptions();

    this.onSelect.set(option);

    const closeOnSelect = this.config.closeOnSelect;
    if (closeOnSelect === 'always' || (!option.isMulti && closeOnSelect === 'not_multi')) {
      this.close();
    }

    return option;
  }

  getMenuOptions(): OptionMenu[] {
    return Select.toFlat(get(this.inputOptions)).filter((option) => option.type === 'menu') as OptionMenu[];
  }

  getOption(id: string): OptionItem | null {
    const option = Select.toFlat(this.getAllOptions()).find((option) => option.id === id);
    return option ?? null;
  }

  getSelectOption(id: string): OptionSelect | null {
    const option = this.getOption(id);
    if (option === null || option.type === 'menu') {
      return null;
    }
    return option;
  }

  getActiveLeaf(): OptionItem | null {
    const active = this.getActiveList();
    if (active.length === 0) {
      return null;
    }
    return active.at(-1) ?? null;
  }

  getActiveList(): OptionItem[] {
    return Select.toFlat(this.getAllOptions()).filter((option) => option.active);
  }

  setActive(setOption: OptionItem | null): void {
    const optionsFlat = Select.toFlat(get(this.inputOptions));
    const searchOptions = get(this.searchOptions);

    for (const option of [...optionsFlat, ...searchOptions]) {
      if (setOption && setOption.id === option.id) {
        option.active = true;
      } else {
        option.active = false;
      }
    }

    if (setOption !== null && !this.isSearchOptionId(setOption.id)) {
      let parent = setOption?.parent;
      while (parent) {
        parent.active = true;
        parent = parent.parent;
      }
    }

    this.inputOptions.set(get(this.inputOptions));
    this.searchOptions.set(get(this.searchOptions));
    const active = this.getActiveLeaf();
  }

  setPrevActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const siblings = this.getSiblings(active);

    const activeIndex = siblings.findIndex((option) => option.id === active.id);
    const prevIndex = Math.max(activeIndex - 1, 0);
    const prev = siblings[prevIndex];
    this.setActive(prev);
  }

  setNextActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const siblings = this.getSiblings(active);

    const activeIndex = siblings.findIndex((option) => option.id === active.id);
    const nextIndex = Math.min(activeIndex + 1, siblings.length - 1);
    const next = siblings[nextIndex];

    this.setActive(next);
  }

  setParentActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    const parent = active.parent;
    if (parent === null) {
      return;
    }
    active.active = false;
    this.setActive(parent);
  }

  setChildActive(): void {
    const active = this.getActiveLeaf();
    if (active === null) {
      this.setFirstActive();
      return;
    }
    if (active.type === 'menu' && active.subOptions.length > 0) {
      const first = active.subOptions[0];
      this.setActive(first);
    }
  }

  private onSearchChange(search: string) {
    if (this.config.allowAdditions) {
      // this.updateAddableOption(search);
    }
    const options = get(this.inputOptions);

    const filtered = options.filter((option) => filterText(option, search));
    const subSelectOptions = Select.toFlatSelect(options)
      .filter((o) => o.parent !== null && filterText(o, search))
      .map(Select.toSearchOption);

    this.filteredOptions.set(filtered);
    this.searchOptions.set(subSelectOptions);

    this.setFirstActive();
  }

  private isSearchOptionId(id: string): boolean {
    return id.startsWith(searchOptionPrefix);
  }

  private updateFilteredOptions(options: OptionItem[]) {
    const search = get(this.search);
    const filtered = options.filter((option) => filterText(option, search));
    this.filteredOptions.set(filtered);
  }

  private updateSearchOptions() {
    const search = get(this.search);
    const active = this.getActiveLeaf();

    const subSelectOptions = [];
    for (const option of Select.toFlatSelect(get(this.inputOptions))) {
      if (option.parent !== null && filterText(option, search)) {
        const newOption = Select.toSearchOption(option);
        if (active?.id === newOption.id) {
          newOption.active = true;
        }
        subSelectOptions.push(newOption);
      }
    }
    this.searchOptions.set(subSelectOptions);
  }

  static toFlat(options: OptionItem[]): OptionItem[] {
    const flat: OptionItem[] = [];
    for (const option of options) {
      flat.push(option);
      if (option.type === 'menu') {
        flat.push(...Select.toFlat(option.subOptions));
      }
    }
    return flat;
  }

  static getParentLabels(option: OptionItem): string[] {
    const labels = [];
    let parent = option.parent;
    while (parent) {
      labels.push(parent.label);
      parent = parent.parent;
    }
    return labels.reverse();
  }

  static toFlatSelect(options: OptionItem[]): OptionSelect[] {
    return Select.toFlat(options).filter((option) => option.type === 'select') as OptionSelect[];
  }

  private getSiblings(option: OptionItem): OptionItem[] {
    if (option.parent && !this.isSearchOptionId(option.id)) {
      return option.parent.subOptions;
    }

    if (get(this.search).length > 0) {
      return this.getShowingSearchOptions();
    }

    return get(this.filteredOptions);
  }

  private setFirstActive() {
    const filteredOptions = get(this.filteredOptions);
    const searchOptions = get(this.searchOptions);
    if (filteredOptions.length > 0) {
      this.setActive(filteredOptions[0]);
    } else if (searchOptions.length > 0) {
      this.setActive(searchOptions[0]);
    }
  }

  private getAllOptions(): OptionItem[] {
    return [...get(this.inputOptions), ...get(this.searchOptions)];
  }

  private getShowingSearchOptions(): OptionItem[] {
    return [...get(this.filteredOptions), ...get(this.searchOptions)];
  }

  private static toSearchOption(option: OptionSelect): OptionSelect {
    return {
      ...option,
      id: [searchOptionPrefix, ...Select.getParentLabels(option)].join(':') + ':' + option.id,
    };
  }

  private static inputToOptionItem(input: InputOptionItem, parent?: OptionItem): OptionItem {
    input.type = input.type ?? 'select';
    switch (input.type) {
      case 'select':
        const withDefaults = {
          ...{
            type: 'select',
            id: input.label,
            selected: false,
            active: false,
            isAdd: false,
            parent: parent ?? null,
            isMulti: false,
          },
          ...input,
        } as OptionSelect;
        return withDefaults;

      case 'menu':
        if (input.subOptions === undefined) {
          throw new Error('subOptions is required for menu type');
        }

        const menuOption = {
          ...{
            type: 'menu',
            id: input.label,
            active: false,
            hasSelected: false,
            parent: parent ?? null,
            subOptions: [],
          },
          ...input,
        } as OptionMenu;

        const subOptions = input.subOptions.map((o) => {
          return Select.inputToOptionItem(o, menuOption);
        });
        menuOption.subOptions = subOptions;

        return menuOption;
    }
  }

  // private updateAddableOption(search: string, config: SelectConfig = this.config) {
  //   const options = get(this.allOptions);
  //   let didChange = false;
  //   if (config.additions) {
  //     if (
  //       search.length >= config.additions.minLength &&
  //       !options.some((option) => option.type === 'select' && option.isAdd === true)
  //     ) {
  //       console.log('add addable option');
  //       didChange = true;
  //       options.push({
  //         type: 'select',
  //         id: config.additions.prefix + search,
  //         label: config.additions.prefix + search,
  //         selected: false,
  //         active: false,
  //         isAdd: true,
  //         parent: null,
  //         isMulti: false,
  //       });
  //     }
  //   } else {
  //     const addableOption = options.find((option) => option.type === 'select' && option.isAdd === true);
  //     if (addableOption !== undefined) {
  //       console.log('remove addable option');
  //       didChange = true;
  //       options.pop();
  //     }
  //   }
  //   if (didChange) {
  //     this.allOptions.set(options);
  //   }
  // }

  onKeyDown(event: KeyboardEvent) {
    if (get(this.isOpen)) {
      switch (event.code) {
        case 'Tab':
          event.preventDefault();
          break;
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (get(this.isOpen)) {
      const activeOption = this.getActiveLeaf();

      if (!activeOption) {
        return;
      }

      switch (event.code) {
        case 'Escape':
          this.close();
          break;

        case 'Enter':
          if (activeOption.type === 'select') {
            this.selectOption(activeOption.id);
          } else {
            this.setChildActive();
          }
          break;

        case 'ArrowDown':
          this.setNextActive();
          break;

        case 'ArrowUp':
          this.setPrevActive();
          break;

        case 'ArrowLeft':
          this.setParentActive();
          break;

        case 'ArrowRight':
          this.setChildActive();
          break;

        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            this.setPrevActive();
          } else {
            this.setNextActive();
          }
          break;
      }
    }
  }
}

export function filterText(option: OptionItem, input = '') {
  return option.label.toLowerCase().includes(input.toLowerCase());
}
