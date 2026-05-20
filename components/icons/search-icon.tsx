import Svg, { Circle, Path } from 'react-native-svg';

interface SearchIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SearchIcon({
  size = 22,
  color = '#F88379',
  strokeWidth = 1.5,
}: SearchIconProps) {
  const width = size;
  const height = (size / 21) * 20;
  return (
    <Svg width={width} height={height} viewBox="0 0 21 20" fill="none">
      <Path
        d="M20 19L17 16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Circle cx="10" cy="10" r="9" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
