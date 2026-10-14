/** Exact critically damped spring: stable even when frames arrive slowly. */
export function stepFormation(value: number, velocity: number, target: number, speed: number, dt: number) {
  const omega = Math.sqrt(680) * speed;
  const offset = value - target;
  const slope = velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  return {
    value: target + (offset + slope * dt) * decay,
    velocity: (velocity - omega * slope * dt) * decay,
  };
}
