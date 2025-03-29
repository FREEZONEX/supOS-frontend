import { FC, useState, useEffect, useRef } from 'react';
import { ComLayout, ComContent } from '@/components';
import { Button, Space, Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PageProps } from '@/common-types';
import { getDashboardDetail } from '@/apis/inter-api/uns';
import { useActivate } from '@/contexts/tabs-lifecycle-context';
import { getSearchParamsObj } from '@/utils';
import { usePrevious } from 'ahooks';
import { useTranslate } from '@/hooks';
import ComText from '@/components/com-text';

const FlowPreview: FC<PageProps> = ({ location }) => {
  const formatMessage = useTranslate();
  const [iframeUrl, setIframeUrl] = useState('');
  const state = getSearchParamsObj(location?.search) || {};
  const breadcrumbList = [
    {
      name: 'Dashboards',
      path: '/dashboards',
    },
    {
      name: state.name,
    },
  ];
  const navigate = useNavigate();
  const timer: any = useRef(null);
  const { id, type, status } = state;
  const previous = usePrevious(state);

  const getIframeUrl = (isFirst = false) => {
    if (!isFirst && previous?.id === id && previous?.status === status) return;
    setIframeUrl('');
    if (id) {
      //fuxa
      if ([2, '2'].includes(type)) {
        setIframeUrl(`/fuxa/home/?id=${id}&status=${status === 'design' ? 'editor' : 'lab'}`);
        return;
      }

      // grafana
      getDashboardDetail(id).then((res: any) => {
        if (res?.meta?.url) {
          setIframeUrl(`${res?.meta?.url}${status === 'design' ? '' : '?kiosk'}`);
        }
      });
    }
  };

  useActivate(() => {
    getIframeUrl();
  });

  useEffect(() => {
    getIframeUrl(true);
  }, []);

  useEffect(() => {
    if (iframeUrl) {
      localStorage.setItem('SearchBar_Hidden', 'true');
      const iframe: any = document?.getElementById('dashboardIframe');
      if (status === 'design' && [1, '1'].includes(type) && iframe) {
        iframe.onload = function () {
          console.log('iframe加载完成');
          timer.current = setInterval(() => {
            const megaMenuToggle = iframe?.contentWindow?.document?.querySelector('#mega-menu-toggle');
            const breadcrumbs = iframe?.contentWindow?.document?.querySelector('[aria-label="Breadcrumbs"]');
            const kioskModeBtn =
              iframe?.contentWindow?.document?.querySelector('[title="Enable kiosk mode"]') ||
              iframe?.contentWindow?.document?.querySelector('[title="启用 kiosk 模式"]');
            const bar =
              iframe?.contentWindow?.document?.querySelector('[title="Toggle top search bar"]') ||
              iframe?.contentWindow?.document?.querySelector('[title="切换顶部搜索栏"]');
            if (megaMenuToggle) {
              try {
                // 隐藏元素
                megaMenuToggle.style.display = 'none';
                megaMenuToggle.style.pos = 'none';
                // 禁用事件监听器
                megaMenuToggle.addEventListener('click', function (event: any) {
                  event.stopPropagation();
                  event.preventDefault();
                });

                breadcrumbs.style.display = 'none';
                // 禁用事件监听器
                breadcrumbs.addEventListener('click', function (event: any) {
                  event.stopPropagation();
                  event.preventDefault();
                });
                kioskModeBtn.style.display = 'none';
                // 禁用事件监听器
                kioskModeBtn.addEventListener('click', function (event: any) {
                  event.stopPropagation();
                  event.preventDefault();
                });

                bar.style.display = 'none';
                // 禁用事件监听器
                bar.addEventListener('click', function (event: any) {
                  event.stopPropagation();
                  event.preventDefault();
                });

                clearInterval(timer.current);
              } catch (err) {
                console.error(err);
                clearInterval(timer.current);
              }
            }
          }, 10);
        };
      }
    }
    return () => {
      clearInterval(timer.current);
    };
  }, [iframeUrl, status]);

  const handleClick = (type: string) => {
    if (!(document.getElementById('dashboardIframe') as HTMLIFrameElement)?.contentWindow?.postMessage) return;

    (document.getElementById('dashboardIframe') as HTMLIFrameElement).contentWindow?.postMessage({
      from: 'supos',
      type,
    });
  };

  return (
    <ComLayout>
      <ComContent
        backPath="/dashboards"
        hasPadding
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Breadcrumb
              separator=">"
              items={breadcrumbList?.map((item: any, idx: number) => {
                if (idx + 1 === breadcrumbList?.length) {
                  return {
                    title: item.name,
                  };
                }
                return {
                  title: <ComText>{item.name}</ComText>,
                  onClick: () => {
                    if (!item.path) return;
                    navigate(item.path);
                  },
                };
              })}
            />
            {[2, '2'].includes(type) && (
              <div>
                <Space>
                  {status === 'design' && (
                    <>
                      <Button onClick={() => handleClick('save')}>{formatMessage('common.save')}</Button>
                      <Button onClick={() => handleClick('export')}>{formatMessage('uns.export')}</Button>
                      <Button onClick={() => handleClick('import')}>{formatMessage('common.import')}</Button>
                    </>
                  )}
                  <Button onClick={() => handleClick('share')}>{formatMessage('common.share')}</Button>
                </Space>
              </div>
            )}
            {/* <Button type="primary" onClick={save}>
              Save
            </Button> */}
          </div>
        }
      >
        <iframe
          key={iframeUrl ?? '-1'}
          id="dashboardIframe"
          src={iframeUrl}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </ComContent>
    </ComLayout>
  );
};

export default FlowPreview;
