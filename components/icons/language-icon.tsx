import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function LanguageIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.99992} stroke={color} strokeWidth={1.5} />
      <Path d="M12 2.00012V22" stroke={color} strokeWidth={1.5} />
      <Path d="M8 3C6.66667 9 6.66667 15 8 21" stroke={color} strokeWidth={1.5} />
      <Path d="M16 3C17.3333 9 17.3333 15 16 21" stroke={color} strokeWidth={1.5} />
      <Path d="M2.00012 12H22" stroke={color} strokeWidth={1.5} />
      <Path d="M19.5 5C15.6143 9 8.38563 9 4.5 5" stroke={color} strokeWidth={1.5} />
      <Path d="M19.5 19C15.6143 15 8.38563 15 4.5 19" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}
