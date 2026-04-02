export const motion = {
  staggerStep: 60,
  fast: 180,
  base: 240,
  slow: 300,
};

export function staggerStyle(index = 0, step = motion.staggerStep) {
  return {
    '--motion-delay': `${index * step}ms`,
  };
}
