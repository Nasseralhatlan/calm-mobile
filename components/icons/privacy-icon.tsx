import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function PrivacyIcon({ size = 24, color = '#000000' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.4837 21.6904C4.28551 17.3577 3.06608 15.8374 3.00271 6.25824C2.99945 5.76512 3.3602 5.34508 3.84492 5.2544C7.50523 4.56967 9.66784 3.36273 11.517 2.28251C11.8174 2.10707 12.1873 2.09924 12.4898 2.27103C14.3788 3.34403 16.1944 4.63845 20.1272 5.27344C20.6245 5.35374 21.0006 5.77856 20.9971 6.28235C20.9319 15.84 19.7084 17.3614 12.5163 21.6904C12.201 21.8802 11.799 21.8802 11.4837 21.6904Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
