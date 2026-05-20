import Svg, { Circle, Path } from 'react-native-svg';

interface AccountIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AccountIcon({
  size = 22,
  color = '#C6C6C6',
  strokeWidth = 1.5,
}: AccountIconProps) {
  const width = size;
  const height = (size / 20) * 22;
  return (
    <Svg width={width} height={height} viewBox="0 0 20 22" fill="none">
      <Path
        d="M9.74967 20.75C5.79549 20.75 2.93245 20.75 1.0737 18.2045C-0.785037 15.6591 5.79551 13.75 9.7497 13.75C13.7039 13.75 20.2854 15.6591 18.4262 18.2045C16.5669 20.7499 13.7039 20.75 9.74967 20.75Z"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Circle cx="9.75001" cy="5.75" r="5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
