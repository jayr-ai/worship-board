// Pure envelope math shared by clip playback and clip audition (4.1, 7):
// "the fade-out begins automatically so that it finishes at the clip's end."
export interface FadeSchedule {
  /** The fade-out length actually used, clamped to the clip's own duration. */
  fadeOutSec: number;
  /** Seconds from the clip's start at which the fade-out ramp should begin. */
  fadeStartSec: number;
}

export function computeFadeSchedule(durationSec: number, requestedFadeOutSec: number): FadeSchedule {
  const fadeOutSec = Math.min(Math.max(0, requestedFadeOutSec), durationSec);
  const fadeStartSec = Math.max(0, durationSec - fadeOutSec);
  return { fadeOutSec, fadeStartSec };
}
