'use client'
import { DraftContext } from "./_components/DraftContext";
import DraftEditor from "./_components/DraftEditor";
import styles from "./page.module.css";
import IdeaInterviewPanel from "./_components/IdeaInterviewPanel";
import { useState } from "react";

export default function Home() {
  return (
    <div className={styles.home}>
      <DraftContext>
        <div style={{ display: "flex" }}>
          <Content />
          <Discussion />
        </div>
      </DraftContext>
    </div>
  );
}

export function Content() {
  return (
    <div className={styles.content} style={{ flex: 3 }}>
      <DraftEditor style={{ minHeight: '90vh' }}/>
    </div>
  );
}

export function Discussion() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={styles.discussion} style={{ flex: 2 }}>
      <IdeaInterviewPanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}