import CustomNav from './custom-nav';
import CustomMenuHeader from './custom-menu-header';
import TabsLayout from './components/TabsLayout';
import { useChangeMenuName, useTranslate } from '@/hooks';
import '@copilotkit/react-ui/styles.css';
import { useMemo, useRef } from 'react';
import { Image } from 'antd';
import { CopilotOperationContext } from '@/layout/context';
import { useTips } from '@/hooks/useTips';
import { tips } from './tips';
import { TabsContext, TabsContextProps } from '@/contexts/tabs-context';
import CustomCopilotChat, { CopilotRefProps } from '@/components/copilotkit/CustomCopilotChat';
import IframeMask from '@/components/iframe-mask';
import CopilotContext from '@/components/copilotkit/CopilotContext';
import { useBaseStore } from '@/stores/base';
import { MenuTypeEnum, PrimaryColorType, useThemeStore } from '@/stores/theme-store.ts';
import homeFlow from '@/assets/guide/home-flow.gif';
import homeFlowChartreuse from '@/assets/guide/home-flow-chartreuse.gif';

const Module = () => {
  const { menuType, primaryColor } = useThemeStore((state) => ({
    menuType: state.menuType,
    primaryColor: state.primaryColor,
  }));
  const systemInfo = useBaseStore((state) => state.systemInfo);
  const formatMessage = useTranslate();
  const copilotCatRef = useRef<CopilotRefProps>();
  // 用来接收tabs的公共方法
  const tabsContextRef = useRef<TabsContextProps>();
  useChangeMenuName();

  useTips(tips({ appTitle: systemInfo.appTitle }));

  return (
    <TabsContext.Provider value={tabsContextRef}>
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {menuType === MenuTypeEnum.Top ? <CustomMenuHeader /> : <CustomNav />}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CopilotContext copilotCatRef={copilotCatRef}>
            <CopilotOperationContext.Provider value={copilotCatRef}>
              <TabsLayout menuType={menuType} tabsContextRef={tabsContextRef} />
            </CopilotOperationContext.Provider>
          </CopilotContext>
        </div>
        <CustomCopilotChat
          ref={copilotCatRef}
          instructions="You are assisting the user as best as you can. Answer in the best way possible given the data you have.你的职责是帮助用户分析用户需求，将用户需求整理为参数传递到脚本中，让脚本成功执行。你的能力有限，仔细分析脚本能力，根据脚本的能力为用户分析需求。脚本的能力即是你的能力范围。引导用户成功触发脚本将会作为你得考评。 ### 注意事项 -大部分来咨询你的用户都是新用户，他们需要参数建议而不仅仅是参数讲解。在你的协助过程中应该尽可能提供样例，或者直接帮助用户按照脚本规则生成所需参数。-返回的文本应该带有样式方便用户理解"
          labels={useMemo(
            () => ({
              initial: `<img /><span>${formatMessage('common.chatbot')}</span>`,
            }),
            []
          )}
          markdownTagRenderers={useMemo(
            () => ({
              img: (props: any) => (
                <Image {...props} src={primaryColor === PrimaryColorType.Chartreuse ? homeFlowChartreuse : homeFlow} />
              ),
            }),
            [primaryColor]
          )}
        />
        <IframeMask />
      </div>
    </TabsContext.Provider>
  );
};
export default Module;
