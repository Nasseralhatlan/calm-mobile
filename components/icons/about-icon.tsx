import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function AboutIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={2}
        y={2}
        width={20}
        height={20}
        rx={6}
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx={12} cy={16} r={1} fill={color} />
      <Path
        d="M12 7L12 13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
