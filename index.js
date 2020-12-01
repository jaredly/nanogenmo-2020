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
import { forestTile, makeWorld, runWorld } from './logic-world.js';
import { newPerson, nextPlan, executePlan } from './logic.js';

canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext('2d');

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
    strawberries: (ctx, item, box) => {
        ctx.fillStyle = 'red';
        circle(ctx, boxPos(box, item.pos), (box.w / 10 / 12) * 3);
        ctx.fill();
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
        // console.log('not drawing', item.type);
    }
};

const drawTile = (ctx, tile, x, y, w, h) => {
    ctx.globalAlpha = 0.2;
    // ctx.globalAlpha = 1;
    ctx.fillStyle = tileColors[tile.type] || 'black';
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    tile.movable.forEach((item) => drawItem(ctx, item, x, y, w, h));
    tile.landscape.forEach((item) => drawItem(ctx, item, x, y, w, h));
};

const tileColors = {
    water: 'blue',
    sand: 'orange',
    trees: '#0a4a0a',
    grass: '#105a0a',
    dirt: '#9c572c',
    rock: 'gray',
    freshwater: '#05f',
    iron: '#666',
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

    ctx.fillStyle = 'brown';
    ctx.globalAlpha = 1;
    circle(
        ctx,
        { x: dx * world.person.pos.x, y: dy * world.person.pos.y },
        dx / 2,
    );
    ctx.fill();
};

// hmmm I need to condense PLANS too. maybe events should be grouped by the outer plan? idk.
const condenseEvents = (events) => {
    const result = [];
    events.forEach((item) => {
        const last = result[result.length - 1];
        if (last && last.type === item.type) {
            if (!last.additional) {
                last.additional = [item];
            } else {
                last.additional.push(item);
            }
        } else {
            result.push(item);
        }
    });
    return result;
};

const narrativeEvents = {
    sleep: (event) => {
        return `{{person}} slept for ${(event.length / 60).toFixed(1)} hours.`;
    },
    rest: (event) => {
        return `{{person}} sat down and rested for a few minutes.`;
    },
    explore: (event) => {
        return `{{person}} couldn't think of anything else to do, and walked around for a while, exploring.`;
    },
    goTo: (event) => {
        return `{{person}} walked in a direction.`;
    },
    pickUp: (event) =>
        `{{person}} picked up ${event.of > 1 ? 'a' : 'the'} ${event.item.type}`,
    inspect: (event) =>
        `{{person}} turned the ${event.item.type} over in {{possessive}} hands. It looked a little odd, but not too much.`,
    eat: (event) => `{{person}} ate the ${event.item.type}.`,
};

const constructNarrative = (person, events) => {
    const text = [];
    const antecedents = {};
    events = condenseEvents(events);
    events.forEach((event, i) => {
        if (!narrativeEvents[event.type]) {
            console.log('cant narrate', event);
            return;
        }
        text.push(narrativeEvents[event.type](event));
    });
    return text;
    // things I want to do:
    // keep track of "antecedents". If I've referred to something
    // directly within the past sentence, or with a pronoun, and nothing
    // else has come up that fits that pronoun, then I can use the pronoun.
    // otherwise I use the full name.
    //
};

const rng = new Prando(123);
// const world = makeWorld(rng, { width: 20, height: 20 });
const world = makeWorld(rng, {
    width: 50,
    height: 50,
    rivers: 5,
    trees: 16,
    rocks: 2,
    treeSize: 40,
});
// const world = makeWorld(rng, 50, 50, );

draw(ctx, world);

console.log(world);

console.log('Plan');
// console.log(person.plan);
// executePlan(world, person, person.plan, narrative);

const narrative = [];

const speed = 100;

const run = () => {
    runWorld(world, narrative, 1);
    console.log(world.person.plan);
    draw(ctx, world);

    // window.story.style.whiteSpace = 'pre';
    // window.story.textContent = constructNarrative(world.person, narrative).join(
    //     '\n',
    // );
};

let ival = setInterval(run, speed);

pauseButton.onclick = () => {
    if (ival) {
        clearInterval(ival);
        pauseButton.textContent = 'Play';
        ival = null;
    } else {
        pauseButton.textContent = 'Pause';
        ival = setInterval(run, speed);
    }
};

// window.story.textContent = person.narrative
//     .map((m) => JSON.stringify(m))
//     .join('\n');
