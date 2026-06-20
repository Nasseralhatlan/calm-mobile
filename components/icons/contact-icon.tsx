import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function ContactIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 10C2 6.68629 4.68629 4 8 4H16C19.3137 4 22 6.68629 22 10V12.8085C22 16.1222 19.3137 18.8085 16 18.8085H14.2715C14.0926 18.8085 13.9158 18.8469 13.753 18.9211L7.30982 21.8587C7.20395 21.907 7.09534 21.7971 7.14484 21.6918L8.41626 18.9867C8.45522 18.9038 8.39473 18.8085 8.30313 18.8085H8C4.68629 18.8085 2 16.1222 2 12.8085V10Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx={8} cy={12} r={1} fill={color} />
      <Circle cx={12} cy={12} r={1} fill={color} />
      <Circle cx={16} cy={12} r={1} fill={color} />
    </Svg>
  );
}
