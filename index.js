// ok

import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';

const rng = new Prando(123);

canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext('2d');
const treeSize = 700;

const world = {
    tiles: [],
    width: 100,
    height: 100,
};

for (let y = 0; y < world.height; y++) {
    world.tiles.push([]);
    for (let x = 0; x < world.width; x++) {
        world.tiles[y].push({ type: 'water' });
    }
}

const makeIsland = () => {
    const cx = world.width / 2;
    const cy = world.height / 2;
    const r = world.width * 0.455;
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            const dx = x - cx;
            const dy = y - cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d <= r) {
                if (r - d < beachSize) {
                    world.tiles[y][x] = { type: 'sand' };
                } else {
                    world.tiles[y][x] = { type: 'dirt' };
                }
            }
        });
    });
};

const randPos = () => {
    const x = (rng.next() * world.width) | 0;
    const y = (rng.next() * world.height) | 0;
    return { x, y };
};

const findClose = (cx, cy, dist, type) => {
    for (let x = (cx - dist) | 0; x < cx + dist; x++) {
        for (let y = (cy - dist) | 0; y < cy + dist; y++) {
            if (x >= 0 && x < world.width && y >= 0 && y < world.height) {
                if (world.tiles[y][x].type === type) {
                    return { x, y };
                }
            }
        }
    }
};

const addPos = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const dist = ({ x, y }) => Math.sqrt(x * x + y * y);
const diff = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
const posKey = ({ x, y }) => `${x}:${y}`;
const posEq = (a, b) => a.x === b.x && a.y === b.y;

// const weights

const chooseWeighted = (frontier) => {
    const totalWeight = frontier.reduce((t, m) => t + m.weight, 0);
    const d = rng.next() * totalWeight;
    let at = 0;
    for (let i = 0; i < frontier.length; i++) {
        at += frontier[i].weight;
        if (at > d) {
            return i;
        }
    }
};

const weight = (pos, center) => 1 / Math.pow(dist(diff(pos, center)), 0.5);
// const weight = (pos, center) => 1 / dist(diff(pos, center));
// const weight = (pos, center) => 1;

// TODO can I weight items based on distance to center? that would be good
const randomGrowth = (center, count, add) => {
    const dirs = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
    ].map(([x, y]) => ({ x, y }));
    const seen = { [posKey(center)]: true };
    const frontier = dirs.map((pos) => ({
        pos: addPos(pos, center),
        weight: weight(addPos(pos, center), center),
    }));
    for (let i = 0; i < count; i++) {
        const d = chooseWeighted(frontier);
        const chosen = frontier[d];
        if (!chosen) {
            continue;
        }
        seen[posKey(chosen.pos)] = true;
        frontier.splice(d, 1);
        if (add(chosen.pos)) {
            const nf = dirs
                .map((pos) => addPos(pos, chosen.pos))
                .filter(
                    (pos) =>
                        !seen[posKey(pos)] &&
                        !frontier.some((m) => posEq(m, pos)),
                )
                .map((pos) => ({ pos, weight: weight(pos, center) }));
            frontier.push(...nf);
        }
    }
};

const beachSize = 4;

const filteredRandPos = (filter, max = 10) => {
    for (let i = 0; i < max; i++) {
        const pos = randPos();
        if (filter(pos)) {
            return pos;
        }
    }
    return null;
};

const growTiles = (onType, tileType) => {
    const pos = filteredRandPos(
        (pos) => world.tiles[pos.y][pos.x].type === onType,
    );
    if (!pos) {
        return;
    }
    world.tiles[pos.y][pos.x] = { type: tileType };
    randomGrowth(pos, treeSize, (pos) => {
        if (world.tiles[pos.y][pos.x].type !== 'dirt') {
            return false;
        }
        world.tiles[pos.y][pos.x] = { type: tileType };
        return true;
    });
};

const color = (tile) => {
    return (
        {
            water: 'blue',
            sand: 'orange',
            trees: '#0a4a0a',
            dirt: '#9c572c',
            rock: 'gray',
        }[tile.type] || 'black'
    );
};

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const wx = canvas.width / world.tiles[0].length;
    const wy = canvas.height / world.tiles.length;
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            ctx.fillStyle = color(tile);
            ctx.fillRect(x * wx, y * wy, wx, wy);
        });
    });
};

makeIsland();

for (let i = 0; i < 12; i++) {
    growTiles('dirt', 'trees');
}

for (let i = 0; i < 5; i++) {
    growTiles('dirt', 'rock');
}

draw();
