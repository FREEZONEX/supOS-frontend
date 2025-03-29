import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  Modifiers,
  MouseSensor,
  PointerActivationConstraint,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Coordinates } from '@dnd-kit/utilities';
import DraggableItem from '../draggable/DraggableItem.tsx';

export enum Axis {
  All,
  Vertical,
  Horizontal,
}

export interface DraggableProps {
  domOpen?: boolean;
  activationConstraint?: PointerActivationConstraint;
  axis?: Axis;
  handle?: boolean;
  modifiers?: Modifiers;
  style?: CSSProperties;
  label?: string;
  children?: ReactNode;
  draggingId?: string | number;
  onDragHandleCallBack?: (
    event: any,
    opt: {
      type?: 'start' | 'end' | 'mouseEnter' | 'mouseLeave';
      isWelt?: boolean;
      weltDirection?: 'left' | 'right';
    }
  ) => void;
  defaultTop?: number;
  defaultLeft?: number;
  threshold?: {
    // 内容宽度
    contentWidth: number;
    contentHeight: number;
    // 边界距离 > 0
    edgeThreshold: number;
    // 边界距离 > 0
    shrinkWidth: number;
  };
}

// 计算百分比坐标
const calculatePercentage = (x: number, y: number) => {
  return {
    xPercent: (x / window.innerWidth) * 100,
    yPercent: (y / window.innerHeight) * 100,
  };
};

// 计算实际坐标值
const calculateActualCoordinates = (xPercent: number, yPercent: number) => {
  return {
    x: (xPercent / 100) * window.innerWidth,
    y: (yPercent / 100) * window.innerHeight,
  };
};

const Index: FC<DraggableProps> = ({
  activationConstraint,
  modifiers,
  axis,
  handle,
  style,
  children,
  draggingId,
  onDragHandleCallBack,
  defaultTop,
  defaultLeft,
  threshold,
  domOpen,
}) => {
  // 初始坐标
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const initialX = threshold
    ? windowWidth - threshold?.contentWidth + threshold?.shrinkWidth
    : (defaultLeft ?? windowWidth - 100);
  const initialY = defaultTop ?? windowHeight - 140;

  // 存储百分比坐标（x, y）
  const [positionPercent, setPositionPercent] = useState<{ x: number; y: number }>({
    x: (initialX / windowWidth) * 100,
    y: (initialY / windowHeight) * 100,
  });

  const [{ x, y }, setCoordinates] = useState<Coordinates>({
    x: initialX,
    y: initialY,
  });

  const weltCurrentX = useRef(threshold ? window.innerWidth - threshold?.contentWidth + threshold?.shrinkWidth : 0);
  const [isWelt, setWelt] = useState(!!threshold);
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint,
  });
  // 触摸板事件
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint,
  });
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor, pointerSensor);
  // 处理鼠标移入和移出
  const handleMouseEnter = (isDragging: boolean) => {
    if (isDragging) return;
    if (
      isWelt &&
      threshold &&
      (x <= -threshold?.shrinkWidth + threshold?.edgeThreshold ||
        x >= window.innerWidth - threshold?.shrinkWidth - threshold?.edgeThreshold)
    ) {
      setCoordinates(({ x, y }) => {
        const finalX = x > 0 ? x - threshold?.shrinkWidth : 0;
        return {
          x: finalX,
          y,
        };
      });
      onDragHandleCallBack?.(null, { type: 'mouseEnter', isWelt: false, weltDirection: x > 0 ? 'right' : 'left' });
    }
  };

  const handleMouseLeave = (isDragging: boolean) => {
    if (isDragging || !isWelt) return;
    if (domOpen) return;
    if (isWelt && threshold) {
      setCoordinates(({ y }) => {
        return {
          x: weltCurrentX.current,
          y,
        };
      });
      onDragHandleCallBack?.(null, {
        type: 'mouseLeave',
        isWelt: true,
        weltDirection: weltCurrentX.current > 0 ? 'right' : 'left',
      });
    }
  };
  useEffect(() => {
    if (domOpen === false && isWelt) {
      setCoordinates(({ y }) => {
        return {
          x: weltCurrentX.current,
          y,
        };
      });
      onDragHandleCallBack?.(null, {
        type: 'mouseLeave',
        isWelt: true,
        weltDirection: weltCurrentX.current > 0 ? 'right' : 'left',
      });
    }
  }, [domOpen, isWelt]);

  // 处理窗口大小变化
  const handleResize = () => {
    const { x, y } = positionPercent;
    const { x: newX, y: newY } = calculateActualCoordinates(x, y);
    const finalX = isWelt
      ? newX < (threshold?.edgeThreshold ?? 0)
        ? -(threshold?.shrinkWidth ?? 0)
        : window.innerWidth - (threshold?.contentWidth ?? 0) + (threshold?.shrinkWidth ?? 0)
      : newX;
    weltCurrentX.current = finalX;
    let finalY = newY;
    if (newY <= 0) {
      finalY = 0;
    } else if (newY + (threshold?.contentHeight ?? 0) > window.innerHeight) {
      finalY = window.innerHeight - (threshold?.contentHeight ?? 0);
    }
    setCoordinates({ x: finalX, y: finalY });
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [positionPercent]);

  return (
    <DndContext
      sensors={sensors}
      modifiers={modifiers}
      onDragStart={(event) => {
        onDragHandleCallBack?.(event, { type: 'start', isWelt });
      }}
      onDragEnd={(event) => {
        const { delta } = event;
        setCoordinates(({ x, y }) => {
          let xWidth = x + delta.x;
          if (xWidth < 0) xWidth = 0;

          if (xWidth + (threshold?.contentWidth || 0) > windowWidth) {
            xWidth = windowWidth - (threshold?.contentWidth || 0);
          }
          const isWelt = !!(
            threshold &&
            (xWidth < threshold?.edgeThreshold ||
              xWidth + threshold?.contentWidth > window.innerWidth - threshold?.edgeThreshold)
          );
          onDragHandleCallBack?.(event, {
            type: 'end',
            isWelt,
            weltDirection: threshold && xWidth < threshold?.edgeThreshold ? 'left' : 'right',
          });
          setWelt(isWelt);
          const finalX = isWelt
            ? xWidth < threshold?.edgeThreshold
              ? -threshold?.shrinkWidth
              : window.innerWidth - threshold?.contentWidth + threshold?.shrinkWidth
            : xWidth;
          weltCurrentX.current = finalX;

          // 计算新的百分比
          const { xPercent, yPercent } = calculatePercentage(finalX, y + delta.y);
          setPositionPercent({ x: xPercent, y: yPercent });

          return {
            x: finalX,
            y: y + delta.y,
          };
        });
      }}
    >
      <DraggableItem
        draggingId={draggingId}
        axis={axis}
        handle={handle}
        top={y}
        left={x}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </DraggableItem>
    </DndContext>
  );
};

export default Index;
