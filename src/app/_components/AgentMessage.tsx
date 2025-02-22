import AgentIcon, { AgentIconType } from "./AgentIcon";
import styles from "./AgentMessage.module.css";

export default function AgentMessage({
  children,
  agentIconType,
  agentName,
  style,
} : {
  children: React.ReactNode,
  agentIconType: AgentIconType,
  agentName: string,
  style?: React.CSSProperties,
}) {

  return (
    <div className={styles.frame} style={style}>
      <AgentIcon agentIconType={agentIconType} />
      <div className={styles.content}>
        <div className={styles.name}>{agentName}</div>
        <div className={styles.message}>
          {children}
        </div>
      </div>
    </div>
  )
}