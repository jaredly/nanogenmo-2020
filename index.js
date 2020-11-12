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

Animals:
- rabbits
- boars
- birds (& eggs)
- snakes?
- raccoons (might steal your food?)
- owls?
- mice? voles?

Ground things:
- rabbit warrens
- boar nests I guess
- snakes holes
- rocks (might have to dig them up)
- twigs
- dead leaves (depending on the season?)
- herbs
- mushrooms
- droppings of various animals
- moss
- lichen on rocks probably
- streams! and rivers! hmm I need that in my map. water source is critical.
- undergrowth. shrubs. ivys/vines.
- roots

Tree things:
- birds nests
- racoon dens (in holes in trees or fallen logs)
- 

^ things have "noticability factor", where some things are immediately obvious,
and some things require you to be looking for it.
if you have greater observantness, more things become obvious.
this factor has a baseline by type of thing, but with some randomness thrown in to account for variability in how occluded a thing is.




*/

const person = {
    vitals: {
        injuries: {
            legs: null,
            arms: null,
            torso: null,
            head: null,
        },
        hunger: 0, // is this the right way to represent it?
        thirst: 0, // maybe it should be "how much food is in you"? or something
        tiredness: 0, // hmmmm
        energy: 100, // this is connected to tiredness, but not exactly the same.
        // but maybe for simplicity I'll just go with energy?
        // well, energy can replenish with resting, but tiredness can only reset with sleep.
    },
    attributes: {
        // determines how much weight you can carry
        strength: 0.5,
        // and how fast you can run (ability to escape from predators maybe?)
        speed: 0.5,
        agility: 0.5,
        // impacts how much energy is expended by doing things.
        fitness: 0.5,
        // likelihood of noticing details
        observantness: 0.5, // attentiveness?
        // ease of inventing tools
        inventiveness: 0.5,
        // how well can you remember where things are in relation to you // maybe "spatial reasoning" is the thing.
        mappingskill: 0.5,
        // how long you deliberate?
        impulsiveness: 0.5,
        curiousity: 0.5,
        // how much risk you are willing to take
        // e.g. "how close to dusk you're willing to stay out", among other things probably
        riskTolerance: 0.5,
    },
    weight: 130,
    height: 70.5,
};

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
const world = makeWorld(rng, 200, 200);
draw();
