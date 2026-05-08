import WaveSurfer from "wavesurfer.js";
import { useRef } from "preact/hooks";
import { useEffect } from "preact/hooks";

export function Waveform(props: {
  el: HTMLAudioElement;
  src: string;
  actionId: string;
  flags: Array<preact.JSX.Element>;
}) {
  const waveId = `waveform_${props.actionId}`;
  const waveRef = useRef<WaveSurfer | null>(null);
  useEffect(() => {
    waveRef.current?.destroy();
    waveRef.current = WaveSurfer.create({
      container: `#${waveId}`,
      cursorColor: "#FF122F",
      waveColor: "#2F8EE5",
      interact: true,
      media: props.el,
      url: props.src || undefined,
      progressColor: "#2F8EE5",
    });
    return () => {
      waveRef.current?.destroy();
      waveRef.current = null;
    };
  }, [props.src]);
  return (
    <div class="wave-container">
      {props.flags}
      <div class="wavesurfer" id={waveId}></div>
    </div>
  );
}
