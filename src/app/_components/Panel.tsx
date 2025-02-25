'use client'

import panelStyles from "./Panel.module.css";
import ExpandCircleDownOutlinedIcon from '@mui/icons-material/ExpandCircleDownOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useEffect, useRef } from 'react';

export default function Panel({
  children,
  title,
  isComplete,
  isOpen,
  setIsOpen,
} : {
  children: React.ReactNode,
  title: string,
  isComplete?: boolean,
  isOpen?: boolean,
  setIsOpen?: (isOpen: boolean) => void,
}) {

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [children, isOpen]);

  return (
    <div className={panelStyles.panel} tabIndex={0}>
      <div className={panelStyles.header} onClick={() => setIsOpen?.(!isOpen)}>
        <h3>
          <span>{title}</span>
          {isComplete &&
            <CheckCircleOutlinedIcon className={panelStyles.checkmark}/>
          }
        </h3>
        <button>
          <ExpandCircleDownOutlinedIcon
            className={`${panelStyles.chevron} ${isOpen ? panelStyles.opened : panelStyles.closed}`}/>
        </button>
      </div>
      { isOpen &&
        <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: '0 16px 0 0' }} ref={contentRef}>
          {children}
        </div>
      }
    </div>
  );
}