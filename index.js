// ok

canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext('2d');

const world = {
    tiles: [],
    width: 50,
    height: 50,
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
                world.tiles[y][x] = { type: 'sand' };
            }
        });
    });
};

const randPos = () => {
    const x = (Math.random() * world.width) | 0;
    const y = (Math.random() * world.height) | 0;
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

const makeTree = () => {
    const pos = randPos();
    const tile = world.tiles[pos.y][pos.x];
    if (tile.type === 'sand') {
        const close = findClose(pos.x, pos.y, 2, 'water');
        if (!close) {
            tile.type = 'trees';
        }
    }
};

const color = (tile) => {
    return (
        { water: 'blue', sand: 'orange', trees: 'green' }[tile.type] || 'black'
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

for (let i = 0; i < 1000; i++) {
    makeTree();
}

draw();
