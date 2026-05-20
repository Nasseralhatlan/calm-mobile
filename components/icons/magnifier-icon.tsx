import Svg, { Ellipse, Path } from 'react-native-svg';

interface MagnifierIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function MagnifierIcon({
  size = 15,
  color = '#FFFFFF',
  strokeWidth = 1.5,
}: MagnifierIconProps) {
  const width = size;
  const height = (size / 15) * 14;
  return (
    <Svg width={width} height={height} viewBox="0 0 15 14" fill="none">
      <Path
        d="M13.4166 12.7499L11.4166 10.7499"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Ellipse cx="6.75" cy="6.74997" rx="6" ry="5.99997" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
