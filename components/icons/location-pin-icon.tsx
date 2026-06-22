import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function LocationPinIcon({
  size = 24,
  color = '#000000',
  strokeWidth = 1.7,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 10c0 5.25-8 11-8 11s-8-5.75-8-11a8 8 0 0 1 16 0Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.75} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
