import { addPos, dist, diff, posKey, posEq } from './utils.js';

const beachSize = 2;

const newTile = (type) => ({
    type,
    ground: [],
    items: [],
    actors: [],
});

export default (
    rng,
    width = 200,
    height = 200,
    rivers = 26,
    trees = 12,
    rocks = 5,
    treeSize = 4700,
) => {
    const world = {
        totalSteps: 0,
        died: 0,
        rng,
        tiles: [],
        actors: [],
        width,
        height,
    };

    for (let y = 0; y < world.height; y++) {
        world.tiles.push([]);
        for (let x = 0; x < world.width; x++) {
            world.tiles[y].push(newTile('water'));
        }
    }

    makeIsland(world);

    for (let i = 0; i < trees; i++) {
        growTiles(world, treeSize, 'dirt', 'trees');
    }

    for (let i = 0; i < rocks; i++) {
        growTiles(world, treeSize, 'dirt', 'rock');
    }

    // Replace some dirt with grass
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile.type === 'dirt' && rng.next() > 0.3) {
                world.tiles[y][x] = { ...newTile('grass'), grassHeight: 1000 };
            }
        });
    });

    // Replace some of the rock with iron
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile.type === 'rock' && rng.next() > 0.8) {
                world.tiles[y][x] = newTile('iron');
            }
        });
    });

    for (let i = 0; i < rivers; i++) {
        growRiver(world);
    }

    return world;
};

const makeIsland = (world) => {
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
                    world.tiles[y][x] = newTile('sand');
                } else {
                    world.tiles[y][x] = newTile('dirt');
                }
            }
        });
    });
};

const randPos = (world) => {
    const x = (world.rng.next() * world.width) | 0;
    const y = (world.rng.next() * world.height) | 0;
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

// const weights

const chooseWeighted = (rng, frontier) => {
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

export const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
].map(([x, y]) => ({ x, y }));

const randomGrowth = (world, center, count, add) => {
    const seen = { [posKey(center)]: true };
    const frontier = dirs.map((pos) => ({
        pos: addPos(pos, center),
        weight: weight(addPos(pos, center), center),
    }));
    for (let i = 0; i < count; i++) {
        const d = chooseWeighted(world.rng, frontier);
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

const riverfy = (world, pos) => {
    const mapCenter = { x: world.width / 2, y: world.height / 2 };
    while (!['water', 'freshwater'].includes(world.tiles[pos.y][pos.x].type)) {
        world.tiles[pos.y][pos.x] = newTile('freshwater');
        const cdist = dist(diff(pos, mapCenter));
        const possible = dirs
            .map((dir) => addPos(pos, dir))
            .filter(
                (pos) =>
                    pos.x >= 0 &&
                    pos.x < world.width &&
                    pos.y >= 0 &&
                    pos.y < world.height &&
                    !['water', 'freshwater'].includes(
                        world.tiles[pos.y][pos.x].type,
                    ),
            )
            .filter((p) => dist(diff(mapCenter, p)) >= cdist - 1)
            .map((pos) => ({
                pos,
                // weight: Math.pow(dist(diff(pos, mapCenter)), 2),
                weight: 1,
            }));
        if (!possible.length) {
            return;
        }
        const i = chooseWeighted(world.rng, possible);
        pos = possible[i].pos;
    }
};

export const filteredRandPos = (world, filter, max = 10) => {
    for (let i = 0; i < max; i++) {
        const pos = randPos(world);
        if (filter(pos)) {
            return pos;
        }
    }
    return null;
};

const growRiver = (world) => {
    const pos = filteredRandPos(
        world,
        (pos) =>
            !['sand', 'water', 'freshwater'].includes(
                world.tiles[pos.y][pos.x].type,
            ),
    );
    if (!pos) {
        return;
    }
    riverfy(world, pos);
};

const growTiles = (world, treeSize, onType, tileType) => {
    const pos = filteredRandPos(
        world,
        (pos) => world.tiles[pos.y][pos.x].type === onType,
    );
    if (!pos) {
        return;
    }
    world.tiles[pos.y][pos.x] = newTile(tileType);
    randomGrowth(world, pos, treeSize, (pos) => {
        if (world.tiles[pos.y][pos.x].type !== 'dirt') {
            return false;
        }
        world.tiles[pos.y][pos.x] = newTile(tileType);
        return true;
    });
};
