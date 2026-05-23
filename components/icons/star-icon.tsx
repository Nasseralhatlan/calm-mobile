import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

interface StarIconProps {
  size?: number;
  color?: string;
}

export function StarIcon({ size = 11, color = '#000000' }: StarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <G clipPath="url(#star_clip)">
        <Path
          d="M3.67692 0.612793L4.62374 2.53094L6.74105 2.84042L5.20899 4.33265L5.57055 6.44077L3.67692 5.44493L1.78329 6.44077L2.14486 4.33265L0.612793 2.84042L2.73011 2.53094L3.67692 0.612793Z"
          fill={color}
          stroke={color}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="star_clip">
          <Rect width="7.35391" height="7.35391" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
