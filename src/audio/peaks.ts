// Waveform peaks computed once per song and cached on the library item, per
// section 7 ("peaks computed once at import and cached").
export function computePeaks(buffer: AudioBuffer, bucketCount = 1200): Float32Array {
  const channelData = buffer.getChannelData(0);
  const peaks = new Float32Array(bucketCount);
  const samplesPerBucket = Math.max(1, Math.floor(channelData.length / bucketCount));

  for (let i = 0; i < bucketCount; i++) {
    const start = i * samplesPerBucket;
    const end = Math.min(start + samplesPerBucket, channelData.length);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > peak) peak = abs;
    }
    peaks[i] = peak;
  }

  return peaks;
}
