// ok

import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';
import makeWorld, { filteredRandPos } from './world.js';
import { Rabbit } from './old_animals.js';
import { tileAt } from './utils.js';
import { rabbit, tick } from './animals.js';

canvas.width = 800;
canvas.height = 800;
const ctx = canvas.getContext('2d');

/*

a tile can have things there.
you can move things from one place to another.
if it's not nailed down, you can pick it up.



Question: how to deal with time in the simulation?
Different things take different amounts of time.
Things can get interrupted.

Each actor has a queue of things to do
each thing potentially has a follow-on thing, which will replace it in the queue.
when the queue is empty, the actor will be queried for what to do next, and it will respond based on its needs n stuff.


*/

const color = (tile) => {
    return (
        {
            water: 'blue',
            sand: 'orange',
            trees: '#0a4a0a',
            grass: '#105a0a',
            dirt: '#9c572c',
            rock: 'gray',
            freshwater: '#05f',
            iron: '#666',
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
            ctx.globalAlpha =
                tile.type === 'grass' ? tile.grassHeight / 1000 : 1;
            ctx.fillRect(x * wx, y * wy, wx, wy);
        });
    });
    world.actors.forEach((actor) => {
        ctx.fillStyle =
            actor.task && actor.task.name == 'sleep' ? 'black' : 'red';
        ctx.fillRect(
            (actor.pos.x + 0.2) * wx,
            (actor.pos.y + 0.2) * wy,
            wx * 0.6,
            wy * 0.6,
        );
    });

    const days = world.totalSteps / DAY_SECONDS;
    const secondsToday = world.totalSteps % DAY_SECONDS;
    const hour = secondsToday / 3600;
    const brightness = _brightness(hour);
    // hour > 4 && hour < 6
    //     ? 1 - (hour - 4) / 2
    //     : hour > 18 && hour < 20
    //     ? (hour - 18) / 2 // 20 - 18 // if at 18, brightness = 1
    //     : hour < 6 || hour > 20
    //     ? 0
    //     : 1;
    if (brightness < 1) {
        // if (hour < 6 || hour > 20) {
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.8 - brightness * 0.8; // 0.6;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
};

const _brightness = (hour) => {
    if (hour > 4 && hour <= 6) {
        return (hour - 4) / 2;
    }
    if (hour > 18 && hour <= 20) {
        return 1 - (hour - 18) / 2;
    }
    if (hour < 6 || hour > 20) {
        return 0;
    }
    return 1;
};

const DAY_SECONDS = 60 * 60 * 24;

const rng = new Prando(123);
// Mini world!
const world = makeWorld(rng, 50, 50, 5, 16, 2, 40);
// const world = makeWorld(rng);

for (let i = 0; i < 20; i++) {
    const rabbitPos = filteredRandPos(
        world,
        (x) => tileAt(world, x).type === 'dirt',
        30,
    );
    // world.actors.push(new Rabbit(5, 2, rabbitPos));
    world.actors.push(rabbit(rabbitPos));
}

draw();

const step = (world) => {
    for (let i = 0; i < steps; i++) {
        world.totalSteps += 1;
        world.actors.forEach((actor) => tick(world, actor));
    }
    // world.actors.forEach((actor) => actor.tick(world, tick));
};

const run = () => {
    step(world, 1);
    window.log.style.whiteSpace = 'pre';

    const days = world.totalSteps / DAY_SECONDS;
    const secondsToday = world.totalSteps % DAY_SECONDS;
    const hour = secondsToday / 3600;

    window.log.textContent = `
    Time: ${parseInt(days)} days ${parseInt(hour * 10) / 10} hours
    ${JSON.stringify(world.actors[0].task)}
    ${parseInt(world.actors[0].hunger / 360) / 10} hours hungry
    ${parseInt(world.actors[0].tiredness / 360) / 10} hours tired
    `;
    draw();
};

let steps = 60 * 60;

let ival = setInterval(run, 100);
pauseButton.onclick = () => {
    if (ival) {
        clearInterval(ival);
        pauseButton.textContent = 'Play';
        ival = null;
    } else {
        pauseButton.textContent = 'Pause';
        ival = setInterval(run, 100);
    }
};
console.log('hi');

numSteps.value = steps;
numSteps.onchange = () => {
    const v = parseInt(numSteps.value);
    if (!isNaN(v)) {
        steps = v;
    }
};
// for (let i = 0; i < 100; i++) {
//     step(world, 1 / 10); // 6 minutes I guess?
//     console.log(world.actors[0].tasks);
//     console.log(world.actors[0].pos);
// }
