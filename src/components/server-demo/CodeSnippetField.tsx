import { Flex } from 'antd';
import classNames from 'classnames';
import ComCodeSnippet from '../com-code-snippet';
import styles from './CodeSnippetField.module.scss';
import { useEffect, useMemo, useRef } from 'react';
import { useSize } from 'ahooks';

interface PropsTypes {
  className?: string;
  labelClassName?: string;
  label?: string;
  value: string;
  minCollapsedNumberOfRows?: number;
  maxCollapsedNumberOfRows?: number;
  isJSON?: boolean;
  onSizeChange: (arg0: any) => void;
}

const CodeSnippetField = (props: PropsTypes) => {
  const {
    className,
    labelClassName,
    label,
    value,
    minCollapsedNumberOfRows,
    maxCollapsedNumberOfRows,
    isJSON,
    onSizeChange,
  } = props;

  const ref = useRef<HTMLDivElement>(null);
  const size = useSize(ref);

  const style = useMemo(() => {
    if (!isJSON) return {};

    return {
      '--supos-switchwrap-active-bg-color': 'var(--supos-charttop-bg-color)',
    };
  }, [isJSON]);

  const content = useMemo(() => {
    if (!isJSON) return value;

    return value ? JSON.stringify(value, null, 2) : undefined;
  }, [isJSON, value]);

  useEffect(() => {
    if (!ref.current) return;
    onSizeChange?.({ height: ref.current?.offsetHeight, width: ref.current?.offsetWidth });
  }, []);

  useEffect(() => {
    onSizeChange?.(size);
  }, [size]);

  const handleSizeChange = () => {
    onSizeChange?.(size);
  };

  if (isJSON && !value) return null;

  return (
    <Flex vertical ref={ref} className={classNames('com-copy-content', styles.container, className)}>
      {label && <div className={classNames('label', labelClassName)}>{label}</div>}
      <Flex className={classNames('content', styles.content)} justify="space-between">
        <ComCodeSnippet
          style={style}
          onSizeChange={handleSizeChange}
          minCollapsedNumberOfRows={minCollapsedNumberOfRows}
          maxCollapsedNumberOfRows={maxCollapsedNumberOfRows}
        >
          {content}
        </ComCodeSnippet>
      </Flex>
    </Flex>
  );
};

export default CodeSnippetField;
