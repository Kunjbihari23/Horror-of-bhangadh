export const BaseUrl = "/horror-of-bhangadh/";
export const ASSETS = {
  Wall: `${BaseUrl}Bhangath_Wall_M1.glb`,
  mohini: `${BaseUrl}mohini.glb`,
  mohini3: `${BaseUrl}mohini-3.glb`,
  mohiniWalking: `${BaseUrl}Walking-mohini.fbx`,
  floor: {
    alpha: `${BaseUrl}coast_sand_rocks_02_1k/alpha.webp`,
    diff: `${BaseUrl}coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp`,
    arm: `${BaseUrl}coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp`,
    normal: `${BaseUrl}coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp`,
    displacement: `${BaseUrl}coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp`,
  },
  fort: `${BaseUrl}Fort_M2.glb`,
  path: {
    color: `${BaseUrl}path-texture/rock_wall_15_diff_2k.jpg`,
    displacement: `${BaseUrl}path-texture/rock_wall_15_disp_2k.png`,
    normal: `${BaseUrl}path-texture/rock_wall_15_nor_gl_2k.exr`,
    roughness: `${BaseUrl}path-texture/rock_wall_15_rough_2k.exr`,
  },
  fortBoard: `${BaseUrl}Bhangarh_board.glb`,
  sounds: {
    ambient: `${BaseUrl}sounds/horror2.mp3`,
    pulse: `${BaseUrl}sounds/horror1.mp3`,
    sting: `${BaseUrl}sounds/horror-cat.mp3`,
  },
  posters: {
    poster1: `${BaseUrl}poster/poster1.jpg`,
    poster2: `${BaseUrl}poster/poster2.png`,
    poster3: `${BaseUrl}poster/poster3.png`,
  },
  brick: {
    color: `${BaseUrl}mixed_brick_wall_1k/mixed_brick_wall_diff_1k.jpg`,
    displacement: `${BaseUrl}mixed_brick_wall_1k/mixed_brick_wall_disp_1k.png`,
    normal: `${BaseUrl}mixed_brick_wall_1k/mixed_brick_wall_nor_gl_1k.png`,
    roughness: `${BaseUrl}mixed_brick_wall_1k/mixed_brick_wall_rough_1k.png`, // ⚠️ note exr
  },
} as const;
