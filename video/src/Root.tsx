import {Composition, AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';

const Test: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#1b1b1b', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{color: 'white', fontSize: 90, opacity: interpolate(f, [0, 30], [0, 1])}}>Tes Remotion</div>
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition id="Tes" component={Test} durationInFrames={60} fps={30} width={1080} height={1920} />
);
