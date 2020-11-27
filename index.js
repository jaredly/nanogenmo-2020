// ok

// import * as ranjs from 'https://unpkg.com/ranjs@1.23.2/src/index.js';
import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';
// import makeWorld, { filteredRandPos } from './world.js';
// import { tileAt, addPos, posKey, posEq } from './utils.js';
// import { rabbit, tick } from './animals.js';
// import person from './person.js';
// import { wait, goToPos, randomWalk } from './tasks.js';
// import * as fm from './framework.js';
// import './logic-world.js';
import { forestTile } from './logic-world.js';

canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext('2d');

const rng = new Prando(123);
const world = {
    tiles: [],
    width: 10,
    height: 10,
    person: {},
};

for (let y = 0; y < world.height; y++) {
    const row = [];
    for (let x = 0; x < world.width; x++) {
        row.push(forestTile(rng));
    }
    world.tiles.push(row);
}

// thinking of tiles as being like 10 feet square

const angleFromPoint = (center, theta, dist) => {
    return {
        x: Math.cos(theta) * dist + center.x,
        y: Math.sin(theta) * dist + center.y,
    };
};

// const rotAround = (center, offset, theta) => {
//     const dx = offset.x - center.x
//     const dy = offset.y - center.y
//     const
// }

const boxPos = (box, pos) => ({
    x: box.x + box.w * pos.x,
    y: box.y + box.h * pos.y,
});

const circle = (ctx, { x, y }, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
};

const drawItems = {
    oakLeaves: (ctx, item, box) => {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#6D4C41';
        circle(ctx, boxPos(box, item.pos), ((box.w / 10) * item.volume) / 2);
        ctx.fill();
    },
    oakBranch: (ctx, item, box) => {
        const pixelsPerInch = box.w / 10 / 12;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = item.width * pixelsPerInch;
        const p1 = angleFromPoint(
            boxPos(box, item.pos),
            item.orientation,
            (item.length / 2) * pixelsPerInch,
        );
        const p2 = angleFromPoint(
            boxPos(box, item.pos),
            item.orientation,
            (-item.length / 2) * pixelsPerInch,
        );
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    },
    mango: (ctx, item, box) => {
        ctx.fillStyle = 'orange';
        circle(ctx, boxPos(box, item.pos), (box.w / 10 / 12) * 3);
        ctx.fill();
    },
    mangoTree: (ctx, item, box) => {
        ctx.fillStyle = 'orange';
        ctx.globalAlpha = 0.4;
        circle(ctx, boxPos(box, item.pos), (box.w / 10) * Math.sqrt(item.age));
        ctx.fill();
    },
    oakTree: (ctx, item, box) => {
        ctx.fillStyle = 'green';
        ctx.globalAlpha = 0.2;
        circle(ctx, boxPos(box, item.pos), (box.w / 10) * Math.sqrt(item.age));
        ctx.fill();
    },
};

const drawItem = (ctx, item, x, y, w, h) => {
    ctx.globalAlpha = 1;
    if (drawItems[item.type]) {
        drawItems[item.type](ctx, item, { x, y, w, h });
    } else {
        console.log('not drawing', item.type);
    }
    // const {size, color} = itemParams(item)
};

const drawTile = (ctx, tile, x, y, w, h) => {
    tile.movable.forEach((item) => drawItem(ctx, item, x, y, w, h));
    tile.landscape.forEach((item) => drawItem(ctx, item, x, y, w, h));
};

const draw = (ctx, world) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dx = canvas.width / world.width;
    const dy = canvas.height / world.height;
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            drawTile(ctx, tile, x * dx, y * dy, dx, dy);
        });
    });
};

draw(ctx, world);

console.log(world);
