export interface EnemyData {
  id: number;
  position: [number, number, number];
  color: string;
  alive: boolean;
  velocity: [number, number];
  changeTimer: number;
}

export interface BulletData {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  life: number;
}

export interface EnemyBulletData {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  life: number;
}

export type GameState = "start" | "playing" | "gameover" | "win";
