import defaultIconUrl from '@/assets/home-icons/default.svg';
import { MENU_TARGET_PATH, STORAGE_PATH } from '@/common-types/constans.ts';

export function getOpenAiUrl() {
  if (import.meta.env.MODE !== 'production') {
    return import.meta.env.REACT_APP_BASE_URL || '';
  }
  return '';
}

export function getBaseUrl() {
  return import.meta.env.REACT_APP_BASE_URL || window.location.origin;
}

export function getDevProxyBaseUrl() {
  return import.meta.env.MODE === 'development' ? '/iframe' : '';
}

export function getFileName(path: string) {
  return path.split('/').pop(); // 切割路径并返回最后一个部分
}

export function getBaseFileName(path: string) {
  if (!path) return path;
  const parts = path.split('/');
  const fileName = parts.pop();
  return fileName ? fileName.replace('.html', '') : '';
}

// 设置参数
export const getSearchParamsString = (obj: any) => {
  if (!obj) return '';
  return new URLSearchParams(obj).toString();
};

// 获取
export const getSearchParamsObj = (str?: string) => {
  if (!str) return {};
  const obj: any = {};
  const searchParams = new URLSearchParams(str);
  searchParams.forEach((value, key) => {
    if (value === 'null') {
      obj[key] = null; // 处理 "null" 字符串
    } else if (value === 'undefined') {
      obj[key] = undefined; // 处理 "undefined" 字符串
    } else {
      obj[key] = value; // 其他情况
    }
  });
  return obj;
};

export const getImageSrcByTheme = (theme: string, iconName?: string) => {
  const fallbackImageUrl = defaultIconUrl; // 前端静态资源的默认图标
  if (!iconName) {
    return { themeImageUrl: '', defaultImageUrl: '', fallbackImageUrl };
  }
  const baseUrl = `${getBaseUrl()}${STORAGE_PATH}${MENU_TARGET_PATH}/`;
  const themeSuffix = theme.includes('chartreuse') ? '-chartreuse' : ''; // 根据主题添加后缀

  // 检查iconName是否已经包含有效的文件后缀
  // 常见的图片扩展名列表
  const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
  let iconNameWithoutExt = iconName;
  let extension = '.svg';
  let hasExtension = false;

  // 获取最后一个点的位置
  const lastDotIndex = iconName.lastIndexOf('.');

  // 如果存在点，并且点后面的内容是有效的扩展名
  if (lastDotIndex !== -1) {
    const possibleExt = iconName.substring(lastDotIndex).toLowerCase();
    hasExtension = validExtensions.includes(possibleExt);

    if (hasExtension) {
      extension = possibleExt; // 获取扩展名（包括点）
      iconNameWithoutExt = iconName.substring(0, lastDotIndex); // 获取不包含扩展名的文件名
    }
  }

  // 如果没有有效扩展名，则整个iconName作为文件名，使用默认扩展名
  if (!hasExtension) {
    iconNameWithoutExt = iconName;
  }

  // 拼接带主题后缀的文件名
  const themeImageUrl = `${baseUrl}${iconNameWithoutExt}${themeSuffix}${extension}`;
  // 默认文件名
  const defaultImageUrl = `${baseUrl}${iconNameWithoutExt}${extension}`;
  return { themeImageUrl, defaultImageUrl, fallbackImageUrl };
};

export const getSearchParamsArray = (params?: URLSearchParams) => {
  if (!params) return [];
  return Array.from(params.entries()).map(([key, value]: [string, string]) => ({
    key,
    value,
  }));
};

export function ensureUrlProtocol(url: string) {
  if (!url) return url;
  const _url = url.trim();
  // 匹配任意合法协议（字母开头，后接 ://）
  if (!/^[a-z]+:\/\//i.test(_url)) {
    return 'http://' + _url;
  }
  return url;
}

export const checkImageExists = (url: string) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// 判断是否在iframe中 以及 是否 匹配了iframe name
export function isInIframe(iframeNames: string[], type: string = 'iframe') {
  try {
    const isWebView = type === 'webview' && navigator.userAgent.includes('WebView/');
    if (isWebView) return true;
    if (!iframeNames?.length) {
      return window.self !== window.top;
    } else {
      return iframeNames.includes(window.name) && window.self !== window.top;
    }
  } catch (err) {
    console.log(err);
    return true;
  }
}
