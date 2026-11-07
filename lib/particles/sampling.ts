export type Particle = {
  id: number;
  homeX: number;
  homeY: number;
  offsetX: number;
  offsetY: number;
  accent: boolean;
  color: string;
  weight: number;
  jitter: number;
  delay: number;
};

export type Sampling = {
  width: number;
  height: number;
  particles: Particle[];
};

export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type Candidate = {
  x: number;
  y: number;
  weight: number;
  color: string;
  accent: boolean;
};

/**
 * Samples the portrait on a fine grid, then keeps a luminance-weighted random
 * subset. A plain uniform grid on a low-key photograph loses the lit face and
 * keeps the black jacket, so selection is weighted and colours come from the
 * pixels themselves.
 */
export function sampleImage(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  density: number,
  options: {
    brightnessThreshold: number;
    scatterRadius: number;
    accentMix: number;
    accentColor: string;
    seed?: number;
  },
): Sampling {
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return { width: sourceWidth, height: sourceHeight, particles: [] };

  context.drawImage(source, 0, 0, sourceWidth, sourceHeight);
  const { data } = context.getImageData(0, 0, sourceWidth, sourceHeight);

  const random = seededRandom(options.seed ?? 7);
  const budget = Math.round(520 + (density - 8) * 60);
  const step = 3;
  const candidates: Candidate[] = [];
  let totalWeight = 0;

  for (let y = 0; y < sourceHeight; y += step) {
    for (let x = 0; x < sourceWidth; x += step) {
      const pixel = (y * sourceWidth + x) * 4;
      if ((data[pixel + 3] ?? 0) < 16) continue;

      const luminance =
        (0.2126 * (data[pixel] ?? 0) + 0.7152 * (data[pixel + 1] ?? 0) + 0.0722 * (data[pixel + 2] ?? 0)) /
        255;

      if (luminance < options.brightnessThreshold) continue;

      // Keep low-lit areas present but rare: weight grows faster than linear.
      const weight = Math.pow(luminance, 1.5) + 0.07;
      totalWeight += weight;

      candidates.push({
        x,
        y,
        weight,
        color: `rgb(${data[pixel] ?? 0},${data[pixel + 1] ?? 0},${data[pixel + 2] ?? 0})`,
        accent: false,
      });
    }
  }

  if (candidates.length === 0) return { width: sourceWidth, height: sourceHeight, particles: [] };

  const selected: Candidate[] = [];
  const target = Math.min(budget, candidates.length);

  if (candidates.length <= target) {
    selected.push(...candidates);
  } else {
    // Weighted reservoir sampling keeps the distribution in one pass.
    let running = 0;
    const marked = new Set<number>();
    for (let i = 0; i < target; i += 1) {
      const point = random() * totalWeight;
      running = 0;
      for (let index = 0; index < candidates.length; index += 1) {
        running += candidates[index]!.weight;
        if (running >= point && !marked.has(index)) {
          marked.add(index);
          selected.push(candidates[index]!);
          break;
        }
      }
    }
  }

  const particles: Particle[] = selected.map((candidate, index) => {
    const angle = random() * Math.PI * 2;
    const radius = options.scatterRadius * (0.35 + random() * 0.65);
    const accent = random() < options.accentMix;

    return {
      id: index,
      homeX: candidate.x,
      homeY: candidate.y,
      offsetX: Math.cos(angle) * radius,
      offsetY: Math.sin(angle) * radius,
      accent,
      color: accent ? options.accentColor : candidate.color,
      weight: candidate.weight,
      jitter: random() * Math.PI * 2,
      delay: random() * 0.3,
    };
  });

  return { width: sourceWidth, height: sourceHeight, particles };
}
