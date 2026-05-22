import Svg, { Path } from 'react-native-svg';

interface ShareIconProps {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}

export function ShareIcon({
  size = 22,
  stroke = '#000000',
  strokeWidth = 1.5,
}: ShareIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V15"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M12 10V2"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M14 4L12.0884 2.08839C12.0396 2.03957 11.9604 2.03957 11.9116 2.08839L10 4"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
