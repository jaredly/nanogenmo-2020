import Prando from 'https://unpkg.com/prando@5.1.2/dist/Prando.es.js';
import { addPos } from './utils.js';

const randRange = (rng, min, max) => rng.next() * (max - min) + min;
const chance = (rng, chance) => rng.next() < chance;
const doit = (rng, min, max, fn) => {
    const num = Math.round(randRange(rng, min, max));
    for (let i = 0; i < num; i++) {
        fn(i);
    }
};

const randPos = (rng) => ({ x: rng.next(), y: rng.next() });
const offsetPos = (rng, pos, offset) =>
    addPos(pos, {
        x: randRange(rng, -offset, offset),
        y: randRange(rng, -offset, offset),
    });

export const forestTile = (rng) => {
    const tile = {
        type: 'forest',
        landscape: [],
        movable: [],
    };

    if (chance(rng, 0.1)) {
        doit(rng, 1, 2, () => {
            const pos = randPos(rng);
            tile.landscape.push({
                type: 'mangoTree',
                pos,
                fruit: 20, // yep simple to start
                // umm age also indicates size
                age: randRange(rng, 5, 60), // feet
            });
            doit(rng, 3, 40, () => {
                tile.movable.push({
                    pos: offsetPos(rng, pos, 0.1),
                    orientation: rng.next() * Math.PI * 2,
                    type: 'mango',
                    weightLbs: randRange(rng, 0.2, 1),
                    ripeness: randRange(rng, 0, 1),
                });
            });
        });
    }

    doit(rng, 0, 3, () => {
        const pos = randPos(rng);
        tile.landscape.push({
            type: 'oakTree',
            pos,
            // age indicates both height and girth here.
            age: randRange(rng, 5, 60), // feet
        });
        doit(rng, 2, 15, () =>
            tile.movable.push({
                pos: offsetPos(rng, pos, 1),
                type: 'oakLeaves',
                volume: randRange(rng, 0.5, 2.5), // cubit feet - well, diameter in feet of the pile
            }),
        );
        doit(rng, 0, 3, () =>
            tile.movable.push({
                id: rng.next(),
                type: 'oakTwigs',
                pos: offsetPos(rng, pos, 0.1),
                volume: randRange(rng, 0.05, 0.2), // cubit feet
            }),
        );
        doit(rng, 0, 2, () =>
            tile.movable.push({
                type: 'oakBranch',
                orientation: rng.next() * Math.PI * 2,
                pos: offsetPos(rng, pos, 0.1),
                strength: randRange(rng, 2, 10),
                length: randRange(rng, 6, 36), // inches
                width: randRange(rng, 0.5, 3),
            }),
        );
    });

    return tile;
};
