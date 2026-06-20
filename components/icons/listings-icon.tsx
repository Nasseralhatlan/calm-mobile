import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function ListingsIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="2 1 20 22" fill="none">
      <Path
        d="M3 7C3 4.23858 5.23858 2 8 2H14.584C14.8503 2 15.1056 2.1062 15.2933 2.29507L20.7093 7.74449C20.8955 7.93184 21 8.18526 21 8.44942V17C21 19.7614 18.7614 22 16 22H8C5.23858 22 3 19.7614 3 17V7Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M15 2.24142C15 2.15233 15.1077 2.10771 15.1707 2.17071L20.8293 7.82929C20.8923 7.89229 20.8477 8 20.7586 8H18C16.3431 8 15 6.65685 15 5V2.24142Z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}
