import Image from "next/image";

export enum AgentIconType {
  Basic,
}

const defaultIconSize = 36;

export default function AgentIcon({
  agentIconType,
  size,
  style,
} : {
  agentIconType: AgentIconType,
  size?: number,
  style?: React.CSSProperties
}) {

  const src = 
    (agentIconType === AgentIconType.Basic) ? "/icon-basic-ai.png" :
    /*default*/ "/icon-basic-ai.png"
  ;

  return (
    <Image src={src}
      alt={src}
      width={size ?? defaultIconSize}
      height={size ?? defaultIconSize}
      style={{ borderRadius: 8, ...style}}
    />
  )
}