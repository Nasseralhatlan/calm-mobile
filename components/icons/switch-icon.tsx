import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function SwitchIcon({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 16.5L19.2253 18.3142C19.5651 18.5054 19.5651 18.9946 19.2253 19.1858L16 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16.634 12C13.2501 12 12.5253 12 7.65369 12C2.78211 12 2.7821 18.75 7.65369 18.75L19 18.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M8 7.5L4.77473 5.68579C4.43491 5.49464 4.43491 5.00536 4.77473 4.81421L8 3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M7.36597 12C10.7499 12 11.4747 12 16.3463 12C21.2179 12 21.2179 5.25 16.3463 5.25L5 5.25"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
