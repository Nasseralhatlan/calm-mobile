import Svg, { Path } from 'react-native-svg';

interface HeartIconProps {
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

export function HeartIcon({
  size = 22,
  stroke = '#000000',
  fill = 'none',
  strokeWidth = 1.5,
}: HeartIconProps) {
  const width = size;
  const height = (size / 22) * 20;
  return (
    <Svg width={width} height={height} viewBox="0 0 22 20" fill="none">
      <Path
        d="M0.778486 7.63574C1.24589 13.7181 7.59482 17.5781 10.7109 18.7478C14.0318 17.6428 20.1195 13.7754 20.673 7.63574C21.6664 -0.0364309 12.7503 -1.08025 10.7109 3.41572C8.74976 -1.08025 0.194229 0.0327555 0.778486 7.63574Z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
}
