const SOUND_PATHS = {
  click: "/sounds/mouse_click.mp3",
  winner: "/sounds/winner.mp3",
  card: "/sounds/bingo_card.wav",
} as const;

type SoundName = keyof typeof SOUND_PATHS;

export function playSound(name: SoundName, volume = 0.6) {
  if (typeof window === "undefined") {
    return;
  }

  const audio = new Audio(SOUND_PATHS[name]);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}
