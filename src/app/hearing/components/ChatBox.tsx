"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./ChatBox.module.css";

type ChatBoxProps = {
  label: string;
  placeholder: string;
  handleSubmit: (label: string, content: string, agent: string) => void;
};

const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [chat, setChat] = useState("");
  const [buttonDisable, setButtonDisable] = useState(true);

  const onSubmit = () => {
    setButtonDisable(true);
    props.handleSubmit(props.label, chat, "BaseAI");
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChat(event.target.value);
    setButtonDisable(!event.target.value);
  };

  return (
    <div className={styles.chatbox_container}>
      <div className={styles.chatbox_textarea}>
        <label htmlFor="FlexTextarea">{props.label}</label>
        <div className={styles.FlexTextarea}>
          <div className={styles.FlexTextarea__dummy} aria-hidden="true"></div>
          <textarea
            id="FlexTextarea"
            className={styles.FlexTextarea__textarea}
            placeholder={props.placeholder}
            onChange={(e) => handleTextChange(e)}
          ></textarea>
        </div>
      </div>
      <div className={styles.chatbox_button}>
        <button
          onClick={onSubmit}
          className={styles.btn_border}
          disabled={buttonDisable}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
