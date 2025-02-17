"use client";

import React, { useState } from "react";
import styles from "./ChatBox.module.css";
import TextArea from "../../_components/TextArea";
import Button from "../../_components/Button";

type ChatBoxProps = {
  label: string;
  placeholder: string;
  handleSubmit: (label: string, content: string, agent: string) => void;
};

const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const [chat, setChat] = useState("");
  const [hasSubmit, setHasSubmit] = useState(true);

  const onSubmit = () => {
    setHasSubmit(true);
    props.handleSubmit(props.label, chat, "BaseAI");
  };

  return (
    <div className={styles.chatbox_container}>
      <div className={styles.chatbox_textarea}>
        <TextArea
          value={chat}
          onChange={setChat}
          placeholder={props.placeholder}
          label={props.label}
        />
      </div>
      <div className={styles.chatbox_button}>
        <Button
          onClick={onSubmit}
          disabled={chat === "" || hasSubmit}
          onlyOnce
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;
