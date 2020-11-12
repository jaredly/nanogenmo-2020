/*
taskFunction, state
if the return value is null, then we're done

task = {fn, state}
*/
import { dirs } from './world.js';
import { addPos, validPos, tileAt, posEq } from './utils.js';

export const wait = (time) => ({
    name: 'wait',
    fn: (world, actor, state) => {
        if (state <= 1) {
            return null;
        }
        return state - 1;
    },
    state: time,
});

export const eatGrass = () => ({
    name: 'eatGrass',
    fn: (world, actor, state) => {
        if (actor.hunger < 5) {
            return null;
        }
        const tile = tileAt(world, actor.pos);
        if (tile.type !== 'grass') {
            return null;
        }
        if (tile.grassHeight <= 1) {
            return null;
        }
        tile.grassHeight -= 0.01;
        actor.hunger -= 1;
        return state;
    },
    state: true,
});

export const isTraversable = (tile) => tile.type !== 'water';
export const isValidFoodTile = (tile) =>
    tile.type === 'grass' && tile.grassHeight > 1;

export const foodNeighbor = (world, pos) => {
    const neighbors = dirs
        .map((dir) => addPos(pos, dir))
        .filter((pos) => validPos(world, pos))
        .filter((pos) => isTraversable(tileAt(world, pos)));
    if (!neighbors.length) {
        console.log('No neighbors', pos);
        return null;
    }
    const grass = neighbors
        .filter((pos) => isValidFoodTile(tileAt(world, pos)))
        .sort(
            (a, b) =>
                tileAt(world, b).grassHeight - tileAt(world, a).grassHeight,
        );
    if (grass.length) {
        return grass[0];
    } else {
        // console.log('no rgass neighbors', neighbors);
        return neighbors[parseInt(world.rng.next() * neighbors.length)];
    }
};

export const nextPos = (current, dest) => {
    const dx = dest.x - current.x;
    const dy = dest.y - current.y;
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        return dest;
    }
    const theta = Math.atan2(dy, dx);
    const x = Math.round(Math.cos(theta));
    const y = Math.round(Math.sin(theta));
    if (x === 0 && y === 0) {
        // console.log('WAIT', dx, dy, theta, x, y);
        if (Math.abs(dx) > Math.abs(dy)) {
            const d = dx > 0 ? 1 : -1;
            return addPos(current, { x: d, y: 0 });
        } else {
            const d = dy > 0 ? 1 : -1;
            return addPos(current, { x: 0, y: d });
        }
    } else {
        return addPos(current, { x, y });
    }
};

export const goToPos = (pos, time) => ({
    state: { pos, time, walkTime: time },
    name: 'goToPos',
    fn: (world, actor, state) => {
        if (state.time > 0) {
            return { ...state, time: state.time - 1 };
        }
        const next = nextPos(actor.pos, state.pos);
        actor.pos = next;
        if (posEq(next, state.pos)) {
            return null;
        }
        return { ...state, time: state.walkTime };
    },
});

export const lookForFood = (world, actor) => {
    const neighbor = foodNeighbor(world, actor.pos);
    if (!neighbor) return null;
    return goToPos(neighbor, actor.tileSpeed);
};

export const goHome = (world, actor) => goToPos(actor.home, actor.tileSpeed);

export const sleep = () => ({
    name: 'sleep',
    fn: (world, actor, state) => {
        if (actor.tiredness > 0) {
            actor.tiredness -= 1;
            return state;
        }
        return null;
    },
    state: true,
});

// const lookForFood = (time) => ({
//     name: 'lookForFood',
//     // how do we indicate that we have a follow-up?
//     fn: (world, actor, state) => {
//         if (state > 0) {
//             return state - 1;
//         }
//         return time;
//     },
//     state: time,
// });
