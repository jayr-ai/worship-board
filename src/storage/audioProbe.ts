// Lightweight metadata probe (duration only, no full decode) so importing a
// full-length Background song doesn't pay decode cost up front. Section 6.4:
// surface a clear error for anything the browser can't play.
export function probeAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };
    const onLoaded = () => {
      const duration = audio.duration;
      cleanup();
      resolve(Number.isFinite(duration) ? duration : 0);
    };
    const onError = () => {
      cleanup();
      reject(new Error("This file couldn't be read as audio. Try MP3, M4A/AAC or WAV."));
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;
  });
}
