import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function EmailIcon({ size = 24, color = '#000000', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M2 6.22222C2 4.99492 2.99492 4 4.22222 4H19.7778C21.0051 4 22 4.99492 22 6.22222V7.42857L12.9239 11.5776C12.3372 11.8459 11.6628 11.8459 11.0761 11.5776L2 7.42857V6.22222Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path d="M2 16L9 11" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M22 16L15 11" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
