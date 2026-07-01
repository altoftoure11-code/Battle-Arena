export interface ObstacleConfig {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
}

export const OBSTACLES: ObstacleConfig[] = [
  { pos: [10,  1.5,  10], size: [4, 3, 4], color: "#5a6e5a" },
  { pos: [-12, 1,   -8],  size: [6, 2, 3], color: "#4a5e4a" },
  { pos: [18,  2,  -15],  size: [3, 4, 3], color: "#506050" },
  { pos: [-20, 1.5, 12],  size: [5, 3, 2], color: "#526252" },
  { pos: [5,   1,  -22],  size: [4, 2, 5], color: "#4e5e4e" },
  { pos: [-8,  2.5, 20],  size: [3, 5, 3], color: "#4a5a4a" },
  { pos: [22,  1,    5],  size: [2, 2, 6], color: "#546454" },
  { pos: [-18, 1,  -20],  size: [4, 2, 4], color: "#4c5c4c" },
  { pos: [0,   1.5, 25],  size: [8, 3, 3], color: "#507050" },
  { pos: [-5,  2,   -5],  size: [2, 4, 2], color: "#4a5a4a" },
  { pos: [28,  1,  -10],  size: [3, 2, 3], color: "#567056" },
  { pos: [-28, 1.5,  5],  size: [3, 3, 5], color: "#4e6e4e" },
  { pos: [15,  1,   28],  size: [5, 2, 3], color: "#506050" },
  { pos: [-15, 1,  -28],  size: [3, 2, 5], color: "#4c5c4c" },
];

const PLAYER_RADIUS = 0.38;

export function resolveObstacleCollision(
  proposed: { x: number; z: number; y: number },
  current:  { x: number; z: number }
): { x: number; z: number } {
  let nx = proposed.x;
  let nz = proposed.z;

  for (const obs of OBSTACLES) {
    const [ox, oy, oz] = obs.pos;
    const [sw, sh, sd] = obs.size;
    const topY = oy + sh / 2;
    if (proposed.y > topY + 0.2) continue;

    const minX = ox - sw / 2 - PLAYER_RADIUS;
    const maxX = ox + sw / 2 + PLAYER_RADIUS;
    const minZ = oz - sd / 2 - PLAYER_RADIUS;
    const maxZ = oz + sd / 2 + PLAYER_RADIUS;

    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      const canSlideX = current.x <= minX || current.x >= maxX;
      const canSlideZ = current.z <= minZ || current.z >= maxZ;
      if (canSlideX) { nx = current.x; }
      if (canSlideZ) { nz = current.z; }
      if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
        nx = current.x;
        nz = current.z;
      }
    }
  }
  return { x: nx, z: nz };
}
