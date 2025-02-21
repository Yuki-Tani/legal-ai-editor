"use client";

import React from "react";
import styles from "./TextArea.module.css";

type TextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  style?: React.CSSProperties;
};

export default function TextArea({value, onChange, placeholder, label, style} : TextAreaProps) {
  return (
    <div className={styles.textarea} style={style}>
      <label htmlFor="FlexTextarea">{label}</label>
      <div className={styles.FlexTextarea}>
        <div className={styles.FlexTextarea__dummy} aria-hidden="true"></div>
        <textarea
          id="FlexTextarea"
          className={styles.FlexTextarea__textarea}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        ></textarea>
      </div>
    </div>
  );
};

