import WaveSurfer from "wavesurfer.js";
import { createRef } from "preact";
import { useEffect } from "preact/hooks";

export function Waveform(props: { el: HTMLAudioElement; actionId: string }) {
  const waveId = `waveform_${props.actionId}`;
  const waveRef = createRef();
  useEffect(() => {
    waveRef.current = WaveSurfer.create({
      container: `#${waveId}`,
      cursorColor: "#FF122F",
      waveColor: "#2F8EE5",
      interact: true,
      media: props.el,
      progressColor: "#2F8EE5",
    });
    return () => {
      waveRef.current.destroy();
    };
  }, []);
  return <div class="wave-container" id={waveId}></div>;
}
