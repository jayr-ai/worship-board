// iOS Safari silences the whole Web Audio graph if the ringer/mute switch is
// on, unless a plain HTML <audio> element is also playing. This builds a
// tiny silent WAV at runtime (no bundled asset needed) and loops it after
// the first user gesture to hold the audio session open.
function buildSilentWavBlob(): Blob {
  const sampleRate = 8000;
  const durationSec = 0.5;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  // Samples are already zeroed (silence).

  return new Blob([buffer], { type: 'audio/wav' });
}

export function createSilentAudioElement(): HTMLAudioElement {
  const audio = new Audio(URL.createObjectURL(buildSilentWavBlob()));
  audio.loop = true;
  audio.volume = 0.01;
  audio.setAttribute('playsinline', 'true');
  return audio;
}
