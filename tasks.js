/*
taskFunction, state
if the return value is null, then we're done

task = {fn, state}
*/
import { dirs } from './world.js';
import {
    addPos,
    validPos,
    tileAt,
    posEq,
    todayHours,
    posKey,
} from './utils.js';
import { rabbit } from './animals.js';

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

export const giveBirth = (duration) => ({
    name: 'giveBirth',
    fn: (world, actor, state) => {
        if (state > 0) {
            return state - 1;
        }
        world.actors.push(rabbit(actor.pos));
    },
    state: duration,
});

export const eatGrass = (time) => ({
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
        tile.grassHeight -= actor.grassPerTick;
        actor.hunger -= actor.hungerAlleviatedPerTick;
        actor.foodConsumed[0] += 1;
        return time - 1;
    },
    state: time,
});

export const isTraversable = (tile) =>
    tile.type !== 'water' && tile.type !== 'freshwater';
export const isValidFoodTile = (tile) =>
    tile.type === 'grass' && tile.grassHeight > 200;

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
        return grass[parseInt(world.rng.next() * grass.length)];
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
        actor.hunger += state.walkTime * 200;
        const next = nextPos(actor.pos, state.pos);
        actor.pos = next;
        if (actor.knowledge) {
            actor.knowledge.tiles[posKey(next)] = true;
        }
        if (posEq(next, state.pos)) {
            return null;
        }
        return { ...state, time: state.walkTime };
    },
});

const goUntil = (inner, cond) => ({
    state: inner(),
    name: 'goUntil',
    fn: (world, actor, state) => {
        const newState = state.fn(world, actor, state.state);
        if (newState == null) {
            if (cond(world, actor)) {
                return null;
            }
            return inner();
        } else {
            state.state = newState;
            return state;
        }
    },
});

const sequence = (items) => ({
    state: items,
    name: 'sequence',
    fn: (world, actor, state) => {
        const newState = state[0].fn(world, actor, state[0].state);
        if (newState == null) {
            state.shift();
            if (state.length === 0) {
                console.log('done with sequence!');
                return null;
            }
        } else {
            state[0].state = newState;
        }
        return state;
    },
});

const randomNeighbor = (world, pos) => {
    const neighbors = dirs
        .map((dir) => addPos(pos, dir))
        .filter((pos) => validPos(world, pos))
        .filter((pos) => isTraversable(tileAt(world, pos)));
    if (!neighbors.length) {
        console.log('No neighbors', pos);
        return null;
    }
    return neighbors[parseInt(world.rng.next() * neighbors.length)];
};

export const randomWalk = (count) => ({
    state: { current: null, count },
    name: 'randomWalk',
    fn: (world, actor, state) => {
        if (!state.current) {
            if (state.count === 0) {
                return null;
            }
            return {
                current: goToPos(
                    randomNeighbor(world, actor.pos),
                    actor.tileSpeed,
                ),
                count: state.count,
            };
        }
        const newState = state.current.fn(world, actor, state.current.state);
        if (newState == null) {
            return { current: null, count: state.count - 1 };
        }
        state.current.state = newState;
        return state;
    },
});

export const foundWarren = (world, actor) => {
    return sequence([
        randomWalk(40),
        goUntil(
            () => lookForFood(world, actor),
            (world, actor) => tileAt(world, actor.pos).type === 'grass',
        ),
        {
            state: null,
            name: 'foundWarren',
            fn: (world, actor, state) => {
                console.log('founded yall', actor.pos, actor.home);
                actor.home = actor.pos;
                return null;
            },
        },
    ]);
};

export const lookForFood = (world, actor) => {
    const neighbor = foodNeighbor(world, actor.pos);
    if (!neighbor) return null;
    return goToPos(neighbor, actor.tileSpeed);
};

export const goHome = (world, actor) => goToPos(actor.home, actor.tileSpeed);

export const sleep = () => ({
    name: 'sleep',
    fn: (world, actor, state) => {
        let thresh = 0;

        const hours = todayHours(world);
        if (hours > 6 && hours < 20) {
            thresh = 60 * 60 * 3; // TODO fancier, ramp off oversleeping
        }

        if (actor.tiredness > thresh) {
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
