import Svg, { Ellipse, Path } from 'react-native-svg';

interface SearchPlusIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SearchPlusIcon({
  size = 14,
  color = '#FFFFFF',
  strokeWidth = 1.5,
}: SearchPlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M13 12.3552L11.0658 10.421"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Ellipse
        cx="6.55263"
        cy="6.55263"
        rx="5.80263"
        ry="5.80263"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M8.48685 6.55261L4.61843 6.55261"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M6.55264 8.48682L6.55264 4.6184"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
