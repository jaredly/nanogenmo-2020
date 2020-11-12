// ok

import {
    wait,
    goHome,
    lookForFood,
    isValidFoodTile,
    sleep,
    isTraversable,
    eatGrass,
} from './tasks.js';
import { tileAt, posEq, todayHours } from './utils.js';

const animalTick = (world, actor) => {
    if (!actor.task || actor.task.name !== 'eatGrass') {
        actor.hunger += 1;
    }
    if (!actor.task || actor.task.name !== 'sleep') {
        actor.tiredness += 0.5;
    }
};

export const animal = (pos) => ({
    tileSpeed: 20,
    hunger: 100,
    tiredness: 0,
    home: pos,
    pos,
    task: null,
    nextTask: (world, actor) => wait(3600),
    tick: animalTick,
});

// const

export const rabbit = (pos) => ({
    ...animal(pos),
    tileSpeed: 30,
    tick: (world, actor) => {
        animalTick(world, actor);
    },
    nextTask: (world, actor) => {
        const tile = tileAt(world, actor.pos);

        const hour = todayHours(world);

        if (hour > 20 || hour < 6) {
            // return sleep();
            if (posEq(actor.pos, actor.home)) {
                return sleep();
            } else {
                return goHome(world, actor);
            }
        }

        if (actor.hunger > 60 * 5) {
            if (isValidFoodTile(tile)) {
                return eatGrass(60 * 5 + 60 * world.rng.next());
            } else {
                return lookForFood(world, actor);
            }
        }

        // what's the formula?
        // there's a range where we'll stay out later eating if we're hungry
        // but we still need to go to sleep.
        //

        // if (actor.hunger > 60 * 60 * 8) {
        //     if (isValidFoodTile(tile)) {
        //         return eatGrass(60 * 5 + 60 * world.rng.next());
        //     } else {
        //         return lookForFood(world, actor);
        //     }
        // }
        // if (actor.tiredness > 60 * 60 * 12) {
        //     if (posEq(actor.pos, actor.home)) {
        //         return sleep();
        //     } else {
        //         return goHome(world, actor);
        //     }
        // }
        // if (actor.hunger > 60) {
        //     if (isValidFoodTile(tile)) {
        //         return eatGrass(60 * 5 + 60 * world.rng.next());
        //     } else {
        //         return lookForFood(world, actor);
        //     }
        // }
        return wait(60);
    },
});

export const tick = (world, actor) => {
    actor.tick(world, actor);
    // console.log(actor.task);
    if (actor.task != null) {
        const newState = actor.task.fn(world, actor, actor.task.state);
        if (newState == null) {
            actor.task = null;
        } else {
            actor.task.state = newState;
        }
    } else {
        actor.task = actor.nextTask(world, actor);
        if (actor.task == null) {
            console.log('Next task nothing!!');
        }
    }
};
