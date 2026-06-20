import Svg, { Path, Rect } from 'react-native-svg';

interface SupportIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SupportIcon({ size = 24, color = '#000000', strokeWidth = 1.5 }: SupportIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.00576 10C5.00576 10 4.53947 3 12 3C19.4605 3 18.9942 10 18.9942 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Rect x="3" y="10" width="5" height="10" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="16" y="10" width="5" height="10" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
