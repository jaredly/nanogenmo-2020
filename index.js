// ok

import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';
import makeWorld from './world.js';

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
            ctx.fillRect(x * wx, y * wy, wx, wy);
        });
    });
};

const rng = new Prando(123);
// Mini world!
const world = makeWorld(rng, 50, 50, 5, 16, 2, 40);
// const world = makeWorld(rng);
draw();
