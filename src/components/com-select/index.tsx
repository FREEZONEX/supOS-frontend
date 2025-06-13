import { forwardRef, useEffect, useState } from 'react';
import { Select, SelectProps } from 'antd';
import debounce from 'lodash/debounce';
import { useTranslate } from '@/hooks';

interface ComSelectProps extends SelectProps {
  options?: any[];
  api?: any;
  debounceTimeout?: number;
  isRequest?: boolean;
}

const ComSelect = forwardRef<any, ComSelectProps>(
  ({ options, api, debounceTimeout = 500, isRequest, ...restProps }, ref) => {
    const formatMessage = useTranslate();
    const [apiOptions, setOptions] = useState([]);

    const searchData = (key?: any) => {
      api(key)
        .then((res: any) => {
          setOptions(res);
        })
        .finally(() => {});
    };

    useEffect(() => {
      if (api && isRequest) {
        searchData();
      }
    }, [isRequest]);
    return api ? (
      <Select
        placeholder={formatMessage('common.select')}
        // notFoundContent={fetching ? <Spin size="small" /> : null}
        {...restProps}
        onSearch={
          api
            ? debounce((searchValue: string) => {
                searchData(searchValue);
              }, debounceTimeout)
            : restProps?.onSearch
        }
        onBlur={
          api
            ? (e) => {
                restProps?.onBlur?.(e);
                searchData();
              }
            : restProps?.onBlur
        }
        options={api ? apiOptions : options}
        ref={ref}
      />
    ) : (
      <Select placeholder={formatMessage('common.select')} {...restProps} options={options} ref={ref} />
    );
  }
);

export default ComSelect;
