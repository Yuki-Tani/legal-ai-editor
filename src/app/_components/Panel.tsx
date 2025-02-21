'use client'

import panelStyles from "./Panel.module.css";
import ExpandCircleDownOutlinedIcon from '@mui/icons-material/ExpandCircleDownOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

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
      { isOpen && children }
    </div>
  );
}