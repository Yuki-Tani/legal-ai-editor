"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from "./ChatBox.module.css";

type ChatProps = {
  label: string;
  text: string;
};

const Chat: React.FC<ChatProps> = (props) => {
  return (
    <div className={styles.chat_container}>
      <div>{props.label}: </div>
      <div>{props.text}</div>
    </div>
  );
};

export default Chat;
