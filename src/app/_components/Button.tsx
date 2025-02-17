"use client";

import React, { useState } from "react";
import styles from "./components.module.css";

type ButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  onlyOnce?: boolean;
  useLoadingAnimation?: boolean;
  isLoading?: boolean;
};

const Loading = () => (
  <div className={styles.button_loader}>
    <div className={styles.loader}>
      <div className={styles.loading_one}></div>
      <div className={styles.loading_two}></div>
      <div className={styles.loading_three}></div>
      <div className={styles.loading_four}></div>
    </div>
  </div>
);

const Button: React.FC<ButtonProps> = ({children, onClick, disabled, onlyOnce, useLoadingAnimation, isLoading}) => {
  const [innerDisabled, setInnerDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClicked = () => {
    if (onlyOnce) {
      setInnerDisabled(true);
    }
    if (useLoadingAnimation) {
      setInnerDisabled(true);
      setLoading(true);
    }
    onClick();
  };

  return (
    <div className={styles.chatbox_button}>
      <button
        onClick={() => handleClicked()}
        className={styles.btn_border}
        disabled={disabled || innerDisabled}
      >
        {(loading || isLoading) ? <Loading /> : children}
      </button>
    </div>
  );
};

export default Button;
