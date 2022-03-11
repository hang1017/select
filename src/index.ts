import Select from './Select';
import Option from './Option';
import OptGroup from './OptGroup';
import type { SelectProps } from './Select';
import BaseSelect from './BaseSelect';
import type { BaseSelectProps, BaseSelectRef, BaseSelectPropsWithoutPrivate } from './BaseSelect';
import useBaseProps from './hooks/useBaseProps';

import 'antd/lib/select/style/index.less';
import 'antd/lib/button/style/index.less';
import 'antd/lib/tag/style/index.less';

export { Option, OptGroup, BaseSelect, useBaseProps };
export type { SelectProps, BaseSelectProps, BaseSelectRef, BaseSelectPropsWithoutPrivate };

export default Select;
