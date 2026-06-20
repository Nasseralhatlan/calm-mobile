import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function HomeIcon({ size = 22, color = '#000000' }: IconProps) {
  const height = (size * 22) / 20;
  return (
    <Svg width={size} height={height} viewBox="0 0 20 22" fill="none">
      <Path
        d="M17.5442 5.94801L10.5757 1.01276C10.081 0.662412 9.419 0.662412 8.9243 1.01276L1.95584 5.94801C1.19952 6.48365 0.75 7.35286 0.75 8.27963V17.5709C0.75 19.1488 2.02919 20.428 3.60714 20.428H5.75C6.53898 20.428 7.17857 19.7884 7.17857 18.9994V16.8566C7.17857 16.0676 7.8182 15.428 8.6071 15.428H10.8929C11.6818 15.428 12.3214 16.0676 12.3214 16.8566V18.9994C12.3214 19.7884 12.961 20.428 13.75 20.428H15.8929C17.4708 20.428 18.75 19.1488 18.75 17.5709V8.27963C18.75 7.35286 18.3005 6.48365 17.5442 5.94801Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
