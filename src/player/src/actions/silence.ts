import { ActionForPlayback } from "../typings";
import { createActionWrapper, render } from "../rendering";
import { onEvent } from "../events";

function createSilentAudioElement(
  durationInSeconds: number
): Promise<HTMLAudioElement> {
  return new Promise((resolve) => {
    // Create an AudioContext
    // @ts-ignore
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // Set the sample rate and frame count based on duration
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * durationInSeconds;

    // Create an empty audio buffer
    const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);

    // Create an OfflineAudioContext to render the audio buffer
    const offlineContext = new OfflineAudioContext(1, frameCount, sampleRate);

    // Create a buffer source
    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    // Connect the buffer source to the context's destination
    bufferSource.connect(offlineContext.destination);

    // Start the buffer source
    bufferSource.start();

    // Render the audio
    offlineContext.startRendering().then((renderedBuffer) => {
      // Convert the rendered buffer to a Blob
      const audioBlob = bufferToBlob(renderedBuffer);

      // Create an audio element
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(audioBlob);

      // Resolve the promise with the audio element
      resolve(audioElement);
    });
  });

  // Function to convert an AudioBuffer to a Blob
  function bufferToBlob(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    // Write the WAV container header
    writeUTFBytes(view, 0, "RIFF");
    view.setUint32(4, 44 + buffer.length * 2 * numberOfChannels, true);
    writeUTFBytes(view, 8, "WAVE");
    writeUTFBytes(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2 * numberOfChannels, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, "data");
    view.setUint32(40, buffer.length * 2 * numberOfChannels, true);

    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i] * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: "audio/wav" });
  }

  // Function to write UTF-8 bytes to a DataView
  function writeUTFBytes(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

const action = {
  render: async (action: ActionForPlayback, done: Function) => {
    const audioEl = await createSilentAudioElement(action.props.duration);
    const audioWrapper = createActionWrapper("div", action);
    audioWrapper.appendChild(audioEl);
    render(audioWrapper, action);
    audioEl.play();
    // If cell is considered done but audio is still playing, then pause the audio
    onEvent(
      "cellDone",
      () => {
        audioEl.pause();
      },
      {
        name: `silence_${action.id}`,
        once: true,
      }
    );
    // On audio complete, mark action done
    audioEl.addEventListener("ended", () => {
      done();
    });
  },
};

export { action };
