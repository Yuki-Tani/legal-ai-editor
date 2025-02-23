'use client'
import { useState, useTransition, useEffect, useRef } from "react";
import panelStyles from "./Panel.module.css";
import TextArea from "./TextArea";
import Button from "./Button";
import IdeaInterviewerAction from "@/api/_agent/IdeaInterviewer";
import CommonDraftWriterAction from "@/api/_agent/CommonDraftWriter";
import { useDraftAccessorContext } from "./DraftContext";
import { AgentIconType } from "./AgentIcon";
import AgentMessage from "./AgentMessage";
import Panel from "./Panel";

export default function IdeaInterviewPanel({
  isOpen,
  setIsOpen,
  onInterviewComplete,
} : {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  onInterviewComplete?: (requirements: string[]) => void,
}) {
  const [draftKind, setDraftKind] = useState("");
  const [isInterviewPending, startInterviewTransition] = useTransition();

  const [requirements, setRequirements] = useState<string[]>([]);

  const [answerText, setAnswerText] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const draftAccessor = useDraftAccessorContext();
  const [isCreatingDraftPending, startCreatingDraftTransition] = useTransition();

  const didCallComplete = useRef(false);

  async function handleStartInterview() {
    startInterviewTransition(async () => {
      const response = await IdeaInterviewerAction({ label: "作成する文書の種類", userRequirement: draftKind });
      setRequirements(response.requirements);
    });
  }

  async function handleAnswer() {
    setAnswers([...answers, answerText]);
    setAnswerText("");

    // if answered all questions
    if (answers.length + 1 == requirements.length) {
      startCreatingDraftTransition(async () => {
        const requestText =
          `作成する文書の種類: ${draftKind}\n` +
          requirements.map((req, index) => `Q: ${req}\nA: ${answers[index]}`).join("\n");

        const response = await CommonDraftWriterAction([], requestText);
        draftAccessor.replaceDraft(response);
        setIsOpen(false);
      });
    }
  }

  const isRequirementsComplete = requirements.length > 0;
  const isUserComplete = (isRequirementsComplete && answers.length == requirements.length);
  const isComplete = isUserComplete && !isCreatingDraftPending;

  useEffect(() => {
    if (isComplete && !didCallComplete.current) {
      didCallComplete.current = true;

      // setTimeout で次のtickに呼ぶ => "Cannot update a component..."を回避
      if (onInterviewComplete) {
        setTimeout(() => {
          onInterviewComplete(requirements);
        }, 0);
      }
    }
  }, [isComplete, requirements, onInterviewComplete]);

  return (
    <Panel
      title="ドラフトの作成"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isComplete={isComplete}
    >
      { requirements.length == 0 ?
        <div>
          <TextArea value={draftKind} onChange={setDraftKind} placeholder="作成する文書の種類を入力"/>
          <div className={panelStyles.buttons}>
            <Button onClick={handleStartInterview} isLoading={isInterviewPending}>
              回答
            </Button>
          </div>
        </div>
        :
        <div>
          <p><span style={{fontWeight: 'bold'}}>文書の種類：</span>{draftKind}</p>
          <hr />
        </div>
      }
      { answers.map((answer, index) => (
          <div key={requirements[index]}>
            <p style={{ fontWeight: 'bold'}}>Q: {requirements[index]}</p>
            <p>{answer}</p>
            <hr />
          </div>
        ))
      }
      { (isRequirementsComplete && !isUserComplete) &&
        <div>
          <p style={{ fontWeight: 'bold'}}>Q: {requirements[answers.length]}</p>
          <TextArea value={answerText} onChange={setAnswerText} />
          <div className={panelStyles.buttons}>
            <Button onClick={handleAnswer}>
              回答
            </Button>
          </div>
        </div>
      }
      { isUserComplete &&
        <AgentMessage
          agentIconType={AgentIconType.Basic}
          agentName={"ドラフト作成 AI"}
        >
          ドラフトを作成しています...
        </AgentMessage>
      }
      { isComplete &&
        <>
          <hr />
          <AgentMessage
            agentIconType={AgentIconType.Basic}
            agentName={"ドラフト作成 AI"}
          >
            ドラフトを作成しました！
          </AgentMessage>
        </>
      }
    </Panel>
  );
}