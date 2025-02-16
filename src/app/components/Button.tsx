"use client";

import React, { useState } from "react";
import styles from "./components.module.css";

type ButtonProps = {
  buttonText: string;
  handleClicked: () => void;
  onlyOnce?: boolean;
  useLoadingAnimation?: boolean;
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

const Button: React.FC<ButtonProps> = (props) => {
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClicked = () => {
    if (props.onlyOnce) {
      setDisabled(true);
    }
    if (props.useLoadingAnimation) {
      setDisabled(true);
      setLoading(true);
    }

    props.handleClicked();
  };

  return (
    <div className={styles.chatbox_button}>
      <button
        onClick={() => handleClicked()}
        className={styles.btn_border}
        disabled={disabled}
      >
        {loading ? <Loading /> : props.buttonText}
      </button>
    </div>
  );
};

export default Button;
