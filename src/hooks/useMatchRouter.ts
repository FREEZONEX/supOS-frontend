import { useState } from 'react';
import { useLocation, useMatches, useOutlet, Location } from 'react-router-dom';
import { useDeepCompareEffect } from 'ahooks';

interface MatchRouteType {
  // 菜单名称
  title: string;
  // 要渲染的组件
  // 图标
  icon?: string;
  children: any;
  // tab对应的url
  pathname: string;
  // tab的key，目前和pathname一样
  routePath: string;
  // 路由，和pathname区别是，详情页 path /:id，routePath是 /1
  path: string;
  // location对象，存储起来用来二次导航
  location: Location;
}

// 匹配路由，拿到信息
export function useMatchRoute(): MatchRouteType | undefined {
  // 获取路由组件实例
  const children = useOutlet();
  // 获取嵌套路由信息
  const matches = useMatches();
  // 获取当前url
  const location = useLocation();

  const [matchRoute, setMatchRoute] = useState<MatchRouteType | undefined>();

  // 监听pathname变了，说明路由有变化，重新匹配，返回新路由信息
  useDeepCompareEffect(() => {
    // 获取当前匹配的路由
    const lastRoute = matches.at(-1);

    if (!lastRoute?.handle) return;

    setMatchRoute({
      title: (lastRoute?.handle as any)?.name,
      icon: (lastRoute?.handle as any)?.icon,
      path: (lastRoute?.handle as any)?.path,
      pathname: location.pathname,
      children,
      routePath: lastRoute?.pathname || '',
      location,
    });
  }, [location]);

  return matchRoute;
}
