import Svg, { Path, Rect } from 'react-native-svg';

interface CalendarIconProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 22, color = '#C6C6C6' }: CalendarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect
        x={0.75}
        y={2.75}
        width={20}
        height={18}
        rx={4}
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M6.75 0.75C4.08333 0.75 4.08333 4.75 6.75 4.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15.75 0.75C13.0833 0.75 13.0833 4.75 15.75 4.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
