"use client";

import React, { useState } from "react";
import styles from "./components.module.css";

type TextAreaProps = {
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  value?: string;
  placeholder?: string;
  label?: string;
};

const Button: React.FC<TextAreaProps> = (props) => {
  const [content, setContent] = useState("");

  const handleChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
    props.onChange(event);
  };

  return (
    <div className={styles.textarea}>
      <label htmlFor="FlexTextarea">{props.label}</label>
      <div className={styles.FlexTextarea}>
        <div className={styles.FlexTextarea__dummy} aria-hidden="true"></div>
        <textarea
          id="FlexTextarea"
          className={styles.FlexTextarea__textarea}
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => handleChanged(e)}
          autoComplete="off"
        ></textarea>
      </div>
    </div>
  );
};

export default Button;
