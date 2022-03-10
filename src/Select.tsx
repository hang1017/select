
import * as React from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import BaseSelect from './BaseSelect';
import type { DisplayValueType, RenderNode } from './BaseSelect';
import OptionList from './OptionList';
import type Option from './Option';
import type OptGroup from './OptGroup';
import type { BaseSelectRef, BaseSelectPropsWithoutPrivate, BaseSelectProps } from './BaseSelect';
import useOptions from './hooks/useOptions';
import SelectContext from './SelectContext';
import useId from './hooks/useId';
import useRefFunc from './hooks/useRefFunc';
import { fillFieldNames, flattenOptions, injectPropsWithOption } from './utils/valueUtil';
import warningProps from './utils/warningPropsUtil';
import useFilterOptions from './hooks/useFilterOptions';
import useCache from './hooks/useCache';

const OMIT_DOM_PROPS = ['inputValue'];

export type OnActiveValue = (
  active: RawValueType,
  index: number,
  info?: { source?: 'keyboard' | 'mouse' },
) => void;

export type OnInternalSelect = (value: RawValueType, info: { selected: boolean }) => void;

export type RawValueType = string | number;
export interface LabelInValueType {
  label: React.ReactNode;
  value: RawValueType;
  /** @deprecated `key` is useless since it should always same as `value` */
  key?: React.Key;
}

export type DraftValueType =
  | RawValueType
  | LabelInValueType
  | DisplayValueType
  | (RawValueType | LabelInValueType | DisplayValueType)[];

export type FilterFunc<OptionType> = (inputValue: string, option?: OptionType) => boolean;

export interface FieldNames {
  value?: string;
  label?: string;
  options?: string;
}

export interface BaseOptionType {
  disabled?: boolean;
  [name: string]: any;
}

export interface DefaultOptionType extends BaseOptionType {
  label: React.ReactNode;
  value?: string | number | null;
  children?: Omit<DefaultOptionType, 'children'>[];
}

export type SelectHandler<ValueType = any, OptionType extends BaseOptionType = DefaultOptionType> =
  | ((value: RawValueType | LabelInValueType, option: OptionType) => void)
  | ((value: ValueType, option: OptionType) => void);

export interface SelectProps<ValueType = any, OptionType extends BaseOptionType = DefaultOptionType>
  extends BaseSelectPropsWithoutPrivate {
  prefixCls?: string;
  id?: string;

  backfill?: boolean;

  // >>> Field Names
  fieldNames?: FieldNames;

  // >>> Search
  /** @deprecated Use `searchValue` instead */
  inputValue?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  autoClearSearchValue?: boolean;

  // >>> Select
  onSelect?: SelectHandler<ValueType, OptionType>;
  onDeselect?: SelectHandler<ValueType, OptionType>;

  // >>> Options
  /**
   * In Select, `false` means do nothing.
   * In TreeSelect, `false` will highlight match item.
   * It's by design.
   */
  filterOption?: boolean | FilterFunc<OptionType>;
  filterSort?: (optionA: OptionType, optionB: OptionType) => number;
  optionFilterProp?: string;
  optionLabelProp?: string;
  children?: React.ReactNode;
  options?: OptionType[];
  defaultActiveFirstOption?: boolean;
  virtual?: boolean;
  listHeight?: number;
  listItemHeight?: number;

  // >>> Icon
  menuItemSelectedIcon?: RenderNode;

  mode?: 'combobox' | 'multiple' | 'tags';
  labelInValue?: boolean;
  value?: ValueType | null;
  defaultValue?: ValueType | null;
  onChange?: (value: ValueType, option: OptionType | OptionType[]) => void;
}

export interface ValueItemProps {
  disabled: any;
  label: string;
  value: string;
  type: 'text' | 'tag';
}

const Select = React.forwardRef(
  (props: SelectProps<any, DefaultOptionType>, ref: React.Ref<BaseSelectRef>) => {
    const {
      id,
      mode,
      prefixCls = 'rc-select',
      backfill,
      fieldNames,

      // Search
      inputValue,
      searchValue,
      onSearch,

      // Select
      onSelect,
      onDeselect,
      dropdownMatchSelectWidth = true,

      // Options
      filterOption,
      filterSort,
      optionFilterProp,
      optionLabelProp,
      options,
      children,
      defaultActiveFirstOption,
      menuItemSelectedIcon,
      virtual,
      listHeight = 200,
      listItemHeight = 20,

      // Value
      value,
      defaultValue,
      labelInValue,
      onChange,

      ...restProps
    } = props;

    const mergedId = useId(id);
    const childrenAsData = !!(!options && children);

    const mergedFilterOption = React.useMemo(() => {
      if (filterOption === undefined && mode === 'combobox') {
        return false;
      }
      return filterOption;
    }, [filterOption, mode]);

    // ========================= FieldNames =========================
    const mergedFieldNames = React.useMemo(
      () => fillFieldNames(fieldNames, childrenAsData),
      /* eslint-disable react-hooks/exhaustive-deps */
      [
        // We stringify fieldNames to avoid unnecessary re-renders.
        JSON.stringify(fieldNames),
        childrenAsData,
      ],
      /* eslint-enable react-hooks/exhaustive-deps */
    );

    // =========================== Search ===========================
    const [mergedSearchValue, setSearchValue] = useMergedState('', {
      value: searchValue !== undefined ? searchValue : inputValue,
      postState: (search) => search || '',
    });

    // =========================== Option ===========================
    const parsedOptions = useOptions(options, children, mergedFieldNames);
    const { valueOptions,  options: mergedOptions } = parsedOptions;

    // =========================== Values ===========================
    const [internalValue, setInternalValue] = useMergedState(defaultValue, {
      value,
    });

    // Fill label with cache to avoid option remove
    const [mergedValues, getMixedOption] = useCache(internalValue, valueOptions);

    /** Convert `displayValues` to raw value type set */
    const rawValues = React.useMemo(
      () => new Set(mergedValues.map((val) => val.value)),
      [mergedValues],
    );

    React.useEffect(() => {
      if (mode === 'combobox') {
        const strValue = mergedValues[0]?.value;

        if (strValue !== undefined && strValue !== null) {
          setSearchValue(String(strValue));
        }
      }
    }, [mergedValues]);

    // ======================= Display Option =======================
    // Create a placeholder item if not exist in `options`
    const createTagOption = useRefFunc((val: RawValueType, label?: React.ReactNode) => {
      const mergedLabel = label ?? val;
      return {
        [mergedFieldNames.value]: val,
        [mergedFieldNames.label]: mergedLabel,
      } as DefaultOptionType;
    });

    // Fill tag as option if mode is `tags`
    const filledTagOptions = React.useMemo(() => {
      if (mode !== 'tags') {
        return mergedOptions;
      }

      // >>> Tag mode
      const cloneOptions = [...mergedOptions];

      // Check if value exist in options (include new patch item)
      const existOptions = (val: RawValueType) => valueOptions.has(val);

      // Fill current value as option
      [...mergedValues]
        .sort((a, b) => (a.value < b.value ? -1 : 1))
        .forEach((item) => {
          const val = item.value;

          if (!existOptions(val)) {
            cloneOptions.push(createTagOption(val, item.label));
          }
        });

      return cloneOptions;
    }, [createTagOption, mergedOptions, valueOptions, mergedValues, mode]);

    const filteredOptions = useFilterOptions(
      filledTagOptions,
      mergedFieldNames,
      mergedSearchValue,
      mergedFilterOption,
      optionFilterProp,
    );

    // Fill options with search value if needed
    const filledSearchOptions = React.useMemo(() => {
      if (
        mode !== 'tags' ||
        !mergedSearchValue ||
        filteredOptions.some((item) => item[optionFilterProp || 'value'] === mergedSearchValue)
      ) {
        return filteredOptions;
      }

      // Fill search value as option
      return [createTagOption(mergedSearchValue), ...filteredOptions];
    }, [createTagOption, optionFilterProp, mode, filteredOptions, mergedSearchValue]);

    const orderedFilteredOptions = React.useMemo(() => {
      if (!filterSort) {
        return filledSearchOptions;
      }

      return [...filledSearchOptions].sort((a, b) => filterSort(a, b));
    }, [filledSearchOptions, filterSort]);

    const displayOptions = React.useMemo(
      () =>
        flattenOptions(orderedFilteredOptions, { fieldNames: mergedFieldNames, childrenAsData }),
      [orderedFilteredOptions, mergedFieldNames, childrenAsData],
    );

    // =========================== Change ===========================
    const triggerChange = (values: ValueItemProps[]) => {

      const labeledValues = values;
      setInternalValue(labeledValues);

      if (
        onChange
      ) {

        const returnOptions = labeledValues.map((v) =>
          injectPropsWithOption(getMixedOption(v.value)),
        );

        onChange(
          labeledValues,
          returnOptions
        );
      }
    };

    // ======================= Accessibility ========================
    const [activeValue, setActiveValue] = React.useState<string>(null);
    const [accessibilityIndex, setAccessibilityIndex] = React.useState(0);
    const mergedDefaultActiveFirstOption =
      defaultActiveFirstOption !== undefined ? defaultActiveFirstOption : mode !== 'combobox';

    const onActiveValue: OnActiveValue = React.useCallback(
      (active, index, { source = 'keyboard' } = {}) => {
        setAccessibilityIndex(index);

        if (backfill && mode === 'combobox' && active !== null && source === 'keyboard') {
          setActiveValue(String(active));
        }
      },
      [backfill, mode],
    );

    // ========================= OptionList =========================
    const triggerSelect = (val: RawValueType, selected: boolean) => {
      const getSelectEnt = (): [RawValueType | LabelInValueType, DefaultOptionType] => {
        const option = getMixedOption(val);
        return [
          labelInValue
            ? {
                label: option?.[mergedFieldNames.label],
                value: val,
                key: option.key ?? val,
              }
            : val,
          injectPropsWithOption(option),
        ];
      };

      if (selected && onSelect) {
        const [wrappedValue, option] = getSelectEnt();
        onSelect(wrappedValue, option);
      } else if (!selected && onDeselect) {
        const [wrappedValue, option] = getSelectEnt();
        onDeselect(wrappedValue, option);
      }
    };

    // ======================= Display Change =======================
    // BaseSelect display values change
    const onDisplayValuesChange: BaseSelectProps['onDisplayValuesChange'] = (nextValues, info) => {
      triggerChange(nextValues);

      if (info.type === 'remove' || info.type === 'clear') {
        info.values.forEach((item) => {
          triggerSelect(item.value, false);
        });
      }
    };

    // =========================== Search ===========================
    const onInternalSearch: BaseSelectProps['onSearch'] = (searchText, info) => {
      setSearchValue(searchText);
      setActiveValue(null);


      // [Submit] Tag mode should flush input
      if (info.source === 'submit') {
        const formatted = (searchText || '').trim();
        // prevent empty tags from appearing when you click the Enter button
        if (formatted) {
          const newRawValues = [...props.value];
           newRawValues.push({
             label: searchText,
             value: searchText,
             type: 'text',
           });
          triggerChange(newRawValues);
          triggerSelect(formatted, true);
          setSearchValue('');
        }

        return;
      }

      if (info.source !== 'blur') {
        onSearch?.(searchText);
      }
    };

    // ========================== Context ===========================
    const selectContext = React.useMemo(() => {
      const realVirtual = virtual !== false && dropdownMatchSelectWidth !== false;
      return {
        ...parsedOptions,
        flattenOptions: displayOptions,
        onActiveValue,
        defaultActiveFirstOption: mergedDefaultActiveFirstOption,
        menuItemSelectedIcon,
        rawValues,
        fieldNames: mergedFieldNames,
        virtual: realVirtual,
        listHeight,
        listItemHeight,
        childrenAsData,
      };
    }, [
      parsedOptions,
      displayOptions,
      onActiveValue,
      mergedDefaultActiveFirstOption,
      menuItemSelectedIcon,
      rawValues,
      mergedFieldNames,
      virtual,
      dropdownMatchSelectWidth,
      listHeight,
      listItemHeight,
      childrenAsData,
    ]);

    // ========================== Warning ===========================
    if (process.env.NODE_ENV !== 'production') {
      warningProps(props);
    }

    // ==============================================================
    // ==                          Render                          ==
    // ==============================================================
    return (
      <SelectContext.Provider value={selectContext}>
        <BaseSelect
          {...restProps}
          // >>> MISC
          id={mergedId}
          prefixCls={prefixCls}
          ref={ref}
          omitDomProps={OMIT_DOM_PROPS}
          mode={mode}
          // >>> Values
          displayValues={mergedValues}
          onDisplayValuesChange={onDisplayValuesChange}
          // >>> Search
          searchValue={mergedSearchValue}
          onSearch={onInternalSearch}
          dropdownMatchSelectWidth={dropdownMatchSelectWidth}
          // >>> OptionList
          OptionList={OptionList}
          emptyOptions={!displayOptions.length}
          // >>> Accessibility
          activeValue={activeValue}
          activeDescendantId={`${mergedId}_list_${accessibilityIndex}`}
        />
      </SelectContext.Provider>
    );
  },
);

if (process.env.NODE_ENV !== 'production') {
  Select.displayName = 'Select';
}

const TypedSelect = Select as unknown as (<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(
  props: React.PropsWithChildren<SelectProps<ValueType, OptionType>> & {
    ref?: React.Ref<BaseSelectRef>;
  },
) => React.ReactElement) & {
  Option: typeof Option;
  OptGroup: typeof OptGroup;
};


export default TypedSelect;
