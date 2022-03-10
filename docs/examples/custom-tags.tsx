/* eslint-disable no-console */
import React from 'react';
import Select, { Option } from 'rc-select';
import '../../assets/index.less';
import type { CustomTagProps } from '../src/interface/generator';

interface IValProps {
  label: string;
  value: string;
  type: 'tag' | 'text';
};

const children = [];
for (let i = 10; i < 36; i += 1) {
  children.push(
    <Option key={i.toString(36) + i} test={i}>
      {i.toString(36) + i}
    </Option>,
  );
}
// [
//   {label: '111', value: '111', type: 'tag'},
//   {label: '222', value: '222', type: 'text'},
//   {label: '333', value: '333', type: 'tag'}
// ]

const Test: React.FC = () => {
  const [value, setValue] = React.useState<IValProps[]>(
    [
  {label: '111', value: '111', type: 'tag'},
  {label: '222', value: '222', type: 'text'},
  {label: '333', value: '333', type: 'tag'}
]
  );

  const tagRender = (props: CustomTagProps) => {
    const { label, closable, onClose } = props;
    let style: React.CSSProperties;
    if (parseInt(label as string, 10)) {
      style = { backgroundColor: 'blue' };
    } else if (!closable) {
      style = { backgroundColor: 'white' };
    } else {
      style = { backgroundColor: 'red' };
    }
    return (
      <span style={style}>
        {label}
        {closable ? (
          <button type="button" onClick={onClose}>
            x
          </button>
        ) : null}
      </span>
    );
  };

  return (
    <div>
      <div>
        <Select
          placeholder="placeholder"
          mode="tags"
          style={{ width: 500 }}
          value={value}
          onChange={(val: IValProps[]) => {
            setValue(val);
          }}
          tagRender={tagRender}
        >
          {children}
        </Select>
      </div>
    </div>
  );
};

export default Test;
/* eslint-enable */
