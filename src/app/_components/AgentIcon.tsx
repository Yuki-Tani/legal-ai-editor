import Image from "next/image";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export enum AgentIconType {
  Basic,
  Manager,
  Hearing,
}

const defaultIconSize = 36;

export default function AgentIcon({
  agentIconType,
  size,
  style,
}: {
  agentIconType: AgentIconType;
  size?: number;
  style?: React.CSSProperties;
}) {
  const src =
    agentIconType === AgentIconType.Basic
      ? "/icon-basic-ai.png"
      : agentIconType === AgentIconType.Hearing
      ? "/icon-hearing-ai.png"
      : /*default*/ "/icon-basic-ai.png";
  if (agentIconType === AgentIconType.Manager) {
    return <AccountCircleIcon />;
  }

  return (
    <Image
      src={src}
      alt={src}
      width={size ?? defaultIconSize}
      height={size ?? defaultIconSize}
      style={{ borderRadius: 8, ...style }}
    />
  );
}
