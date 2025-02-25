import Image from "next/image";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export enum AgentIconType {
  Basic,
  Manager,
  Hearing,
  Hourei,
  KeihinJirei,
  KinouseiHyoujiShokuhin,
  TokuteiShouhiHouIhanJirei,
  WebResearch,
  PublicComment,
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
  var src = "/icon-basic-ai.png";
  switch (agentIconType) {
    case AgentIconType.Basic:
      src = "/icon-basic-ai.png";
      break;
    case AgentIconType.Manager:
      src = "/icon-basic-ai.png";
      break;
    case AgentIconType.Hearing:
      src = "/icon-hearing-ai.png";
      break;
    case AgentIconType.Hourei:
      src = "/icon-hourei-ai.png";
      break;
    case AgentIconType.KeihinJirei:
      src = "/icon-keihin-jirei-ai.png";
      break;
    case AgentIconType.KinouseiHyoujiShokuhin:
      src = "/icon-kinousei-hyouji-ai.png";
      break;
    case AgentIconType.TokuteiShouhiHouIhanJirei:
      src = "/icon-ihan-jirei-ai.png";
      break;
    case AgentIconType.WebResearch:
      src = "/icon-web-research-ai.png";
      break;
    case AgentIconType.PublicComment:
      src = "/icon-public-comment-ai.png";
      break;
  }

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
