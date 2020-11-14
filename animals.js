// ok

import {
    wait,
    goHome,
    lookForFood,
    isValidFoodTile,
    sleep,
    isTraversable,
    eatGrass,
    giveBirth,
} from './tasks.js';
import { tileAt, posEq, todayHours } from './utils.js';

const animalTick = (world, actor) => {
    if (!actor.task || actor.task.name !== 'eatGrass') {
        actor.hunger += 1;
    }
    if (!actor.task || actor.task.name !== 'sleep') {
        actor.tiredness += 0.5;
    }
    actor.lastPregnancy += 1;
    if (actor.pregnancy) {
        actor.pregnancy.time -= 1;
    }
};

/*

Ok, so we need some way of tracking the "health" of the animal.
Here only thinking about nutritional health.

after some threshhold, rabbits can't get enough food.

Instead of "hunger"
what if we talked about "how full the stomach is"?
And then we have BMI?
where a certain amount of food is required to maintain BMI
once you get below a certain BMI you can't walk as far.
maybe that's where "energy" comes in?
say, a rabbit has enough energy to go 5 blocks comfortably.
if they need to go more, it will wear them down? idk.

*/

export const animal = (pos) => ({
    id: Math.random().toString(36).slice(2),
    tileSpeed: 20,
    hunger: 100,
    tiredness: 0,
    home: pos,
    pos,
    task: null,
    nextTask: (world, actor) => wait(3600),
    tick: animalTick,
    lastPregnancy: 0,
    lastPregnancyCheck: 0,
    pregnancy: null,
    foodConsumed: [0],
    age: 60 * 60 * 24 * 30 * 3, // 3 months old I guess
});

const DAY_SECONDS = 60 * 60 * 24;

export const rabbit = (pos) => ({
    ...animal(pos),
    tileSpeed: 30,
    tick: (world, actor) => {
        animalTick(world, actor);

        // top of the day
        if (world.totalSteps % DAY_SECONDS === 0) {
            console.log('day');
            actor.foodConsumed.splice(0, 0, 0);
            if (actor.foodConsumed.length > 5) {
                actor.foodConsumed.splice(5, actor.foodConsumed.length - 5);
            }

            if (actor.hunger > DAY_SECONDS) {
                console.log('dead', actor.id);
                const idx = world.actors.indexOf(actor);
                if (idx !== -1) {
                    world.actors.splice(idx, 1);
                }
            }

            if (actor.hunger > DAY_SECONDS / 2 && actor.pregnancy) {
                actor.pregnany = null;
            }
        }
    },
    nextTask: (world, actor) => {
        const tile = tileAt(world, actor.pos);

        const hour = todayHours(world);

        if (hour > 20 || hour < 6) {
            if (posEq(actor.pos, actor.home)) {
                if (actor.pregnancy && actor.pregnancy.time <= 0) {
                    return giveBirth(world.rng.next() * 60 * 5 + 60 * 30);
                }
                if (world.totalSteps - actor.lastPregnancyCheck > DAY_SECONDS) {
                    actor.lastPregnancyCheck = world.totalSteps;
                    // this should check only once per day
                    if (
                        actor.pregnancy == null &&
                        // actor.lastPregnancy > DAY_SECONDS * 10 && // wait 30 days since last
                        actor.lastPregnancy > DAY_SECONDS * 10 && // wait 30 days since last
                        world.rng.next() < 0.02
                    ) {
                        // console.log('pregnant!');
                        actor.lastPregnancy = 0;
                        actor.pregnancy = {
                            time: DAY_SECONDS * (5 + world.rng.next() * 5),
                            // time: DAY_SECONDS * (28 + world.rng.next() * 5),
                            // size: parseInt(3 + world.rng.next() * 11),
                            size: 2,
                        };
                    }
                }

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
