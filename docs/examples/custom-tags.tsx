/* eslint-disable no-console */
import React from 'react';
import Select from 'rc-select';
import { Button } from 'antd';
import '../../assets/index.less';

/**
 * 设置随机值
 */
export const getRandom = () => {
  const val = `${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return val;
};

interface IValProps {
  label: string;
  value: string;
  type: 'tag' | 'text';
}

const Test: React.FC = () => {
  const [value, setValue] = React.useState<IValProps[]>([
    { label: '111', value: '111', type: 'tag' },
    { label: '222', value: '222', type: 'text' },
    { label: '333', value: '333', type: 'tag' },
  ]);

  const addTag = () => {
    const newVal = [...value];
    newVal.push({ label: '333', value: getRandom(), type: 'tag' });
    setValue(newVal);
  };

  return (
    <div>
      <div>
        <Select
          placeholder="请选择"
          mode="tags"
          style={{ width: 500 }}
          value={value}
          onChange={(val: IValProps[]) => {
            setValue(val);
          }}
          onClick={() => console.log('this is click')}
        />
      </div>
      <Button onClick={addTag}>新增一个 tag</Button>
    </div>
  );
};

export default Test;
/* eslint-enable */
