// import { Due } from './due';

// import { createId } from '@paralleldrive/cuid2';
// import { DateTime } from 'luxon';
// import { CADENCE, DAY_TYPE, DayType } from '../../schemas/due';
// import { BASE_TEST_DATE, defaultTaskTime } from '../../utils/date.time';

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function defaultFields(fields: any) {
//   const dateAt = fields.dateAt ? defaultTaskTime(DateTime.fromISO(fields.dateAt)) : BASE_TEST_DATE;
//   return {
//     dateAt: dateAt,
//     recurringId: fields.recurringId ?? createId(),
//     recurringCadence: fields.recurringCadence ?? CADENCE.monthly,
//     recurringDay: fields.recurringDay ?? dateAt.day,
//     recurringMonthlyDayType: fields.recurringMonthlyDayType ?? DAY_TYPE.specific,
//     recurringWeeklyInterval: fields.recurringWeeklyInterval ?? null,
//     belongsToMonth: fields.belongsToMonth ?? dateAt.month,
//     belongsToYear: fields.belongsToYear ?? dateAt.year,
//     periodKind: fields.periodKind ?? null,
//   };
// }
import { describe, it, expect } from 'vitest';
import { Select, type InputOptionItem, type OptionItem, type SelectConfig } from './select.js';

describe('Select', () => {
  describe('inputToOptionItem', () => {
    const tests: { name: string; inputOptions: InputOptionItem[]; options: OptionItem[]; config?: SelectConfig }[] = [
      {
        name: 'simple no selected',
        inputOptions: [
          {
            label: '1',
          },
          {
            label: '2',
          },
        ],
        options: [
          {
            type: 'select',
            id: '1',
            label: '1',
            selected: true,
            active: false,
            isAdd: false,
          },
          {
            type: 'select',
            id: '2',
            label: '2',
            selected: false,
            active: false,
            isAdd: false,
          },
        ],
      },
      {
        name: 'simple with selected',
        inputOptions: [
          {
            label: '1',
            selected: true,
          },
          {
            label: '2',
          },
        ],
        options: [
          {
            type: 'select',
            id: '1',
            label: '1',
            selected: true,
            active: false,
            isAdd: false,
          },
          {
            type: 'select',
            id: '2',
            label: '2',
            selected: false,
            active: false,
            isAdd: false,
          },
        ],
      },
      {
        name: 'menu with selected',
        inputOptions: [
          {
            type: 'menu' as const,
            label: '1',
            subOptions: [
              {
                label: '1.1',
                selected: true,
              },
              {
                label: '1.2',
              },
            ],
          },
          {
            label: '2',
            selected: true,
          },
        ],
        options: [
          {
            type: 'menu',
            id: '1',
            label: '1',
            hasSelected: true,
            active: false,
            subOptions: [
              {
                type: 'select',
                id: '1.1',
                label: '1.1',
                selected: true,
                active: false,
                isAdd: false,
              },
              {
                type: 'select',
                id: '1.2',
                label: '1.2',
                selected: false,
                active: false,
                isAdd: false,
              },
            ],
          },
          {
            type: 'select',
            id: '2',
            label: '2',
            selected: false,
            active: false,
            isAdd: false,
          },
        ],
      },
      {
        name: '3 layers deep',
        inputOptions: [
          {
            type: 'menu' as const,
            label: '1',

            subOptions: [
              {
                type: 'menu' as const,
                label: '1.1',
                subOptions: [
                  {
                    label: '1.1.1',
                    selected: true,
                  },
                ],
              },
            ],
          },
        ],
        options: [
          {
            type: 'menu',
            id: '1',
            label: '1',
            hasSelected: true,
            active: false,
            subOptions: [
              {
                type: 'menu',
                id: '1.1',
                label: '1.1',
                hasSelected: true,
                active: false,
                subOptions: [
                  {
                    type: 'select',
                    id: '1.1.1',
                    label: '1.1.1',
                    selected: true,
                    active: false,
                    isAdd: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    for (const test of tests) {
      const { name, inputOptions, options } = test;
      it(name, () => {
        const select = new Select(inputOptions);
        expect(select.getOptions()).toEqual(options);
      });
    }
  });

  const defaultInputOptions: InputOptionItem[] = [
    {
      type: 'menu' as const,
      label: '1',
      subOptions: [
        {
          label: '1.1',
        },
        {
          type: 'menu' as const,
          label: '1.2',
          subOptions: [
            {
              label: '1.2.1',
            },
            {
              label: '1.2.2',
            },
          ],
        },
        {
          label: '1.3',
        },
      ],
    },
    {
      label: '2',
    },
  ];

  describe('selectOption', () => {
    const tests: { name: string; selectIds: string[]; inputOptions: InputOptionItem[]; config?: SelectConfig }[] = [
      {
        name: 'select inside of menu',
        selectIds: ['1.2.1'],
        inputOptions: defaultInputOptions,
      },
      {
        name: 'select multiple',
        selectIds: ['1.1', '1.2.2'],
        inputOptions: defaultInputOptions,
        config: { isMulti: true },
      },
    ];

    for (const test of tests) {
      const { name, inputOptions, config } = test;
      it(name, () => {
        const select = new Select(inputOptions, config);
        for (const selectId of test.selectIds) {
          select.selectOption(selectId);
        }
        const selected = select.getSelected();

        expect(selected.length).toEqual(test.selectIds.length);
        expect(selected.map((o) => o.id)).toEqual(test.selectIds);
      });
    }
  });

  describe('setActive', () => {
    it('set active inside of menu', () => {
      const select = new Select(defaultInputOptions);
      select.setActive('1.3');

      const activeOptions = select.getActiveList();
      expect(activeOptions.length).toEqual(2);
      expect(activeOptions.map((o) => o.id)).toEqual(['1', '1.3']);
    });
  });
});
