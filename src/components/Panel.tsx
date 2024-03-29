'use client';

import clsx from 'clsx';
import {useDragControls} from 'framer-motion';
import {motion} from 'framer-motion';

import {usePanel} from '@/src/components/PanelContext';

export function Panel({
  children,
  dragConstraints,
  title,
  buttons,
  icon,
  className,
}: {
  children: React.ReactNode;
  dragConstraints: React.RefObject<HTMLElement>;
  title?: string;
  buttons?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  const {zIndex, active, activate} = usePanel();
  const controls = useDragControls();

  return (
    <motion.div
      initial={{opacity: 0, scale: 0.7}}
      animate={{opacity: 1, scale: 1.0}}
      exit={{opacity: 0, scale: 0.9}}
      drag
      dragListener={false}
      dragControls={controls}
      dragConstraints={dragConstraints}
      whileDrag={{scale: 1.05}}
      dragTransition={{power: 0.15, timeConstant: 100}}
      onPointerDown={() => {
        activate();
      }}
      style={{zIndex}}
      className={clsx(
        'bg-background/80 backdrop-blur-md backdrop-saturate-150 rounded-lg ring-2 ring-brand-100/30 focus-within:ring-brand-400/50 overflow-hidden shadow-black/50 transition-shadow',
        active ? 'shadow-xl' : 'shadow-md',
        className,
      )}
    >
      <div className="bg-brand-100/10 flex flex-col">
        <div className="flex flex-row items-center bg-brand-100/10">
          <div
            onPointerDown={(e) => controls.start(e)}
            className="flex-1 flex flex-row items-center gap-2 p-2 cursor-move select-none"
          >
            <div className="flex-1 flex flex-row items-center gap-2">
              {icon && <div>{icon}</div>}
              {title}
            </div>
            {buttons}
          </div>
        </div>
        <div className="flex flex-col relative">{children}</div>
      </div>
    </motion.div>
  );
}
