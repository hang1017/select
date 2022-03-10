import * as React from 'react';
import type { RawValueType } from '../BaseSelect';
import type { DefaultOptionType, ValueItemProps } from '../Select';

/**
 * Cache `value` related LabeledValue & options.
 */
export default (
  labeledValues: ValueItemProps[],
  valueOptions: Map<RawValueType, DefaultOptionType>,
): [ValueItemProps[], (val: RawValueType) => DefaultOptionType] => {
  const cacheRef = React.useRef({
    values: new Map<RawValueType, ValueItemProps>(),
    options: new Map<RawValueType, DefaultOptionType>(),
  });

  const getOption = React.useCallback(
    (val: RawValueType) => valueOptions.get(val) || cacheRef.current.options.get(val),
    [valueOptions],
  );

  return [labeledValues, getOption];
};
