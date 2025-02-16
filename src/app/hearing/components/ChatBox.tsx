"use client";

import React, { useRef, useState, useEffect } from "react";
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
        <TextArea
          onChange={(e) => handleTextChange(e)}
          placeholder={props.placeholder}
          label={props.label}
        />
      </div>
      <div className={styles.chatbox_button}>
        <Button
          buttonText="Submit"
          handleClicked={onSubmit}
          disabled={buttonDisable}
          onlyOnce
        />
      </div>
    </div>
  );
};

export default ChatBox;
