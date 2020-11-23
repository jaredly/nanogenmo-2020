// ok

import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';
import makeWorld, { filteredRandPos } from './world.js';
import { tileAt, addPos, posKey, posEq } from './utils.js';
import { rabbit, tick } from './animals.js';
import person from './person.js';
import { wait, goToPos } from './tasks.js';
import * as fm from './framework.js';

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

const actorColor = (actor) => {
    if (actor.type === 'person') {
        return 'orange';
    }
    if (!actor.task) {
        return 'gray';
    }
    if (actor.task.name === 'sleep') {
        return 'black';
    }
    if (actor.task.name === 'eatGrass') {
        return 'red';
    }
    return 'blue';
};

const fogOfWar = true;

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const wx = canvas.width / world.tiles[0].length;
    const wy = canvas.height / world.tiles.length;
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (fogOfWar && !mainCharacter.knowledge.tiles[posKey({ x, y })]) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'black';
                ctx.fillRect(x * wx, y * wy, wx, wy);
            } else {
                ctx.fillStyle = color(tile);
                ctx.globalAlpha =
                    tile.type === 'grass' ? tile.grassHeight / 1000 : 1;
                ctx.fillRect(x * wx, y * wy, wx, wy);
            }
        });
    });
    ctx.globalAlpha = 1;
    world.actors.forEach((actor) => {
        if (fogOfWar && !posEq(actor.pos, mainCharacter.pos)) {
            return;
        }
        ctx.fillStyle = actorColor(actor);
        const margin = 0.3;
        ctx.fillRect(
            (actor.pos.x + margin) * wx,
            (actor.pos.y + margin) * wy,
            wx * (1 - margin * 2),
            wy * (1 - margin * 2),
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

for (let i = 0; i < 5; i++) {
    const rabbitPos = filteredRandPos(
        world,
        (x) => tileAt(world, x).type === 'dirt',
        30,
    );
    if (!rabbitPos) continue;
    for (let r = 0; r < 5; r++) {
        world.actors.push(rabbit(rabbitPos, world));
    }
}

const mainCharacter = person(
    { x: (world.width / 2) | 0, y: (world.height / 2) | 0 },
    135,
    70,
);
mainCharacter.task = wait(3600 * 5);
world.actors.push(mainCharacter);

draw();

const step = (world) => {
    world.totalSteps += 1;
    world.actors.forEach((actor) => tick(world, actor));
    world.tiles.forEach((row) =>
        row.forEach((tile) => {
            if (tile.type === 'grass' && tile.grassHeight < 1000) {
                tile.grassHeight += 0.001;
            }
        }),
    );
};

const run = () => {
    const start = Date.now();
    for (let i = 0; i < steps; i++) {
        step(world);
        if (mainCharacter.task == null) {
            break;
        }
        // exceeded the 5 second limit, sorry
        if (Date.now() - start > 5000) {
            break;
        }
    }
    window.log.style.whiteSpace = 'pre';
    window.log.style.fontFamily = 'monospace';

    const days = world.totalSteps / DAY_SECONDS;
    const secondsToday = world.totalSteps % DAY_SECONDS;
    const hour = secondsToday / 3600;

    let lowGrass = 0;
    world.tiles.forEach((row) =>
        row.forEach((tile) =>
            tile.type === 'grass' && tile.grassHeight < 200
                ? (lowGrass += 1)
                : null,
        ),
    );

    window.log.textContent = `
    Time: ${parseInt(days)} days ${parseInt(hour * 10) / 10} hours
    ${JSON.stringify(world.actors[0].task)}
    ${parseInt(world.actors[0].hunger / 360) / 10} hours hungry
    ${parseInt(world.actors[0].tiredness / 360) / 10} hours tired

    ${world.actors.length} rabbits

    Grass tiles with under 20%: ${lowGrass}

    ${world.actors.filter((a) => a.pregnancy != null).length} pregnant

    ${world.died} died
    `;
    // ${world.actors
    //     .map((actor) => actor.hunger.toString().padStart(5))
    //     .join(' : ')}

    // ${world.actors
    //     .map((actor) => actor.midnightHunger.map((x) => x.toString()).join(' '))
    //     .join('\n')}
    draw();

    if (mainCharacter.task == null) {
        clearInterval(ival);
        ival = null;
        fm.render(options, playerControls(world, mainCharacter));
    }
};

const andJoin = (items) => {
    if (items.length === 1) {
        return items[0];
    }
    if (items.length === 2) {
        return items[0] + ' and ' + items[1];
    }
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
};

const describeTile = (world, tile) => {
    const place = {
        grass: 'in a field of grasses',
        trees: 'in a forest',
        dirt: 'on some dirt',
        freshwater: 'swimming in fresh water',
        water: 'swimming in the ocean',
        rock: 'on a rocky outcropping',
    }[tile.type];
    const whatsHere = [];
    if (tile.ground.length) {
        // want to sort by noticability
        whatsHere.push(
            'You see ' +
                andJoin(tile.ground.map((item) => `a ${item.type}`)) +
                '.',
        );
    }
    if (tile.items.length) {
        whatsHere.push(
            'You see ' +
                andJoin(tile.items.map((item) => `a ${item.type}`)) +
                '.',
        );
    }
    return `You are ${place}. ${whatsHere.join(' ')}`;
};

const doTask = (task) => {
    mainCharacter.task = task;
    clearInterval(ival);
    ival = setInterval(run, 100);
};

const playerControls = (world, mainCharacter) => {
    const description = describeTile(world, tileAt(world, mainCharacter.pos));
    const dirs = { '<-': [-1, 0], '^': [0, -1], v: [0, 1], '->': [1, 0] };
    return fm.div({}, [
        description,
        fm.div({}, [
            Object.keys(dirs).map((name) => {
                const [x, y] = dirs[name];
                return fm.button(
                    {
                        onclick: () =>
                            doTask(
                                goToPos(
                                    addPos(mainCharacter.pos, { x, y }),
                                    60,
                                ),
                            ),
                    },
                    [name],
                );
            }),
        ]),
    ]);
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
