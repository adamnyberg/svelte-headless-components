import type { ComponentType } from 'svelte';
import { get, writable, type Writable } from 'svelte/store';

type OptionBase = {
  id: string;
  label: string;
  active: boolean;
  parent: MenuOption | null;
  data?: Record<string, any>;
};

export type SelectOption = OptionBase & {
  type: 'select';
  selected: boolean;
  isAdd: boolean;
};
export type InputSelectOption = Partial<Omit<SelectOption, 'label'>> & Pick<SelectOption, 'label'>;

export type MenuOption = OptionBase & {
  type: 'menu';
  hasSelected: boolean;
  subOptions: OptionItem[];
};
export type InputMenuOption = Partial<Omit<MenuOption, 'label' | 'subOptions'>> &
  Pick<MenuOption, 'label'> & { subOptions: InputOptionItem[] };

export type Additions = {
  prefix: string;
  minLength: number;
};
export type SelectConfig = {
  isMulti?: boolean;
  additions?: Additions;
};

export type OptionItem = SelectOption | MenuOption;

export type InputOptionItem = InputMenuOption | InputSelectOption;

export class Select {
  readonly options: Writable<OptionItem[]>;
  readonly selected: Writable<SelectOption[]>;
  readonly onSelect: Writable<SelectOption>;
  readonly isOpen = writable(false);
  search: Writable<string>;
  config: SelectConfig;

  constructor(inputOptions: InputOptionItem[], config: SelectConfig = { isMulti: false }) {
    const options = inputOptions.map((option) => Select.inputToOptionItem(option));

    const selectOptions = Select.toFlatSelect(options);

    if (selectOptions.length === 0) {
      throw new Error('Select must have at least one option');
    }

    const selected = selectOptions.filter((option) => option.selected);
    if (!config.isMulti && selected.length > 1) {
      for (const option of selected.slice(1)) {
        option.selected = false;
      }
    }

    if (selected.length === 0 && !config.isMulti) {
      selectOptions[0].selected = true;
      this.onSelect = writable(selectOptions[0]);
    } else {
      this.onSelect = writable(selected[0]);
    }

    this.options = writable(options);
    this.config = config;

    this.selected = writable([]);
    this.options.subscribe((options) => {
      const newSelected = Select.toFlatSelect(options).filter((option) => option.selected);
      this.selected.set(newSelected);
    });

    this.search = writable('');
    this.search.subscribe((search) => {
      this.onSearchChange(search);
    });
  }

  open(): void {
    console.log('open');
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
    console.log('toggleIsOpen');
    if (get(this.isOpen)) {
      this.close();
    } else {
      this.open();
    }
  }

  getOption(id: string): OptionItem | null {
    const option = Select.toFlat(get(this.options)).find((option) => option.id === id);
    return option ?? null;
  }

  getSelectOption(id: string): SelectOption | null {
    const option = this.getOption(id);
    if (option === null || option.type === 'menu') {
      return null;
    }
    return option;
  }

  selectOption(id: string): SelectOption {
    const option = this.getSelectOption(id);
    if (option === null) {
      throw new Error(`option with id ${id} not found`);
    }
    // if not multi then deselect all other options
    if (!this.config.isMulti) {
      const optionsFlat = Select.toFlat(get(this.options));
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

    option.selected = this.config.isMulti ? !option.selected : true;

    this.options.set(get(this.options));

    this.onSelect.set(option);

    if (!this.config.isMulti) {
      this.close();
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

  getActiveList(options = get(this.options)): OptionItem[] {
    return Select.toFlat(options).filter((option) => option.active);
  }

  setActive(setOption: OptionItem | null): void {
    const optionsFlat = Select.toFlat(get(this.options));

    for (const option of optionsFlat) {
      if (setOption && setOption.id === option.id) {
        option.active = true;
      } else {
        option.active = false;
      }
    }

    let parent = setOption?.parent;
    while (parent) {
      parent.active = true;
      parent = parent.parent;
    }

    this.options.set(get(this.options));
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

  private getSiblings(option: OptionItem): OptionItem[] {
    if (option.parent) {
      return option.parent.subOptions;
    }
    return get(this.options);
  }

  private onSearchChange(search: string) {
    if (this.config.additions) {
      this.updateAddableOption(search);
    }
  }

  private setFirstActive() {
    const options = get(this.options);
    if (options.length === 0) {
      return;
    }
    this.setActive(options[0]);
  }

  private static toFlat(options: OptionItem[]): OptionItem[] {
    const flat: OptionItem[] = [];
    for (const option of options) {
      flat.push(option);
      if (option.type === 'menu') {
        flat.push(...Select.toFlat(option.subOptions));
      }
    }
    return flat;
  }

  private static toFlatSelect(options: OptionItem[]): SelectOption[] {
    return Select.toFlat(options).filter((option) => option.type === 'select') as SelectOption[];
  }

  private static inputToOptionItem(input: InputOptionItem, parent?: OptionItem): OptionItem {
    input.type = input.type ?? 'select';
    switch (input.type) {
      case 'select':
        const withDefaults = {
          ...{ type: 'select', id: input.label, selected: false, active: false, isAdd: false, parent: parent ?? null },
          ...input,
        } as SelectOption;
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
        } as MenuOption;

        const subOptions = input.subOptions.map((o) => {
          return Select.inputToOptionItem(o, menuOption);
        });
        menuOption.subOptions = subOptions;

        return menuOption;
    }
  }

  private static filterOptions(options: OptionItem[], input: string): OptionItem[] {
    const filtered = [];
    for (const option of options) {
      if (option.type === 'menu' && option.subOptions.filter((o) => filterText(input, o)).length > 0) {
        filtered.push(option);
      } else if (option.type === 'select' && filterText(input, option)) {
        filtered.push(option);
      }
    }
    return filtered;
  }

  private updateAddableOption(search: string, config: SelectConfig = this.config) {
    const options = get(this.options);
    let didChange = false;
    if (config.additions) {
      if (
        search.length >= config.additions.minLength &&
        !options.some((option) => option.type === 'select' && option.isAdd === true)
      ) {
        console.log('add addable option');
        didChange = true;
        options.push({
          type: 'select',
          id: config.additions.prefix + search,
          label: config.additions.prefix + search,
          selected: false,
          active: false,
          isAdd: true,
          parent: null,
        });
      }
    } else {
      const addableOption = options.find((option) => option.type === 'select' && option.isAdd === true);
      if (addableOption !== undefined) {
        console.log('remove addable option');
        didChange = true;
        options.pop();
      }
    }
    if (didChange) {
      this.options.set(options);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (get(this.isOpen)) {
      switch (event.code) {
        case 'Tab':
          console.log('Prevent Tab');
          event.preventDefault();
          break;
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (get(this.isOpen)) {
      const activeOption = this.getActiveLeaf();

      if (!activeOption) {
        console.log('No active option');
        return;
      }

      switch (event.code) {
        case 'Escape':
          console.log('Escape');
          this.close();
          break;

        case 'Enter':
          console.log('Enter');
          if (activeOption.type === 'select') {
            console.log('select', activeOption);
            this.selectOption(activeOption.id);
          } else {
            this.setChildActive();
          }
          break;

        case 'ArrowDown':
          console.log('ArrowDown');
          this.setNextActive();
          break;

        case 'ArrowUp':
          console.log('ArrowUp');
          this.setPrevActive();
          break;

        case 'ArrowLeft':
          console.log('ArrowLeft');
          this.setParentActive();
          break;

        case 'ArrowRight':
          console.log('ArrowRight');
          this.setChildActive();
          break;

        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            console.log('Tab shift');
            this.setPrevActive();
          } else {
            console.log('Tab');
            this.setNextActive();
          }
          break;
      }
    }
  }
}

export function filterText(input: string, option: OptionItem) {
  return option.label.toLowerCase().includes(input.toLowerCase());
}
