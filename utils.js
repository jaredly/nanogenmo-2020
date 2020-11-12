//

export const tileAt = (world, pos) => world.tiles[pos.y][pos.x];
export const addPos = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const dist = ({ x, y }) => Math.sqrt(x * x + y * y);
export const diff = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
export const posKey = ({ x, y }) => `${x}:${y}`;
export const posEq = (a, b) => a.x === b.x && a.y === b.y;
export const validPos = (world, pos) =>
    pos.x >= 0 && pos.x < world.width && pos.y >= 0 && pos.y < world.height;
