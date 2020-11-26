//
const between = (a, b, c) => a >= b && a < c;

const betweens = (number, ats) => {
    for (let at of ats) {
        if (at[0] <= number) {
            return at[1];
        }
    }
};
const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = HOUR_SECONDS * 24;

export default (pos, weight, height) => {
    const person = {
        pos,
        tileSpeed: 60,
        vitals: {
            injuries: {
                legs: null,
                arms: null,
                torso: null,
                head: null,
            },
            // have you eaten today?
            // you haven't eaten since yesterday.
            // you need to eat at least X calories per day in order to maintain energy and body weight.
            // X calories ... ... ... you get hungry ... if you stay hungry ...
            //
            // ok ugh I need to just decide what I think will be the thing.

            // and it can be simple, it's fine.

            // hunger goes up from zero
            // when it's more than 4 hours, you feel hungry
            // when it's more than 6 hours, you feel very hungry
            // more than 8 hours, you feel weak with hunger
            // more than 16 hours, you feel very weak with hunger
            // after that you start losing health

            health: 100,

            hunger: 0, // is this the right way to represent it?
            thirst: 0, // maybe it should be "how much food is in you"? or something
            long_energy: 100, // hmmmm
            energy: 100, // this is connected to tiredness, but not exactly the same.
            // but maybe for simplicity I'll just go with energy?
            // well, energy can replenish with resting, but tiredness can only reset with sleep.
        },
        describe: (world, person, mainCharacter) => {
            const statuses = [
                betweens(person.vitals.health, [
                    [100, 'You are uninjured.'],
                    [75, 'You are somewhat hurt.'],
                    [50, 'You are very hurt.'],
                    [25, 'You are gravely injured.'],
                    [0, 'You are nearly dead.'],
                ]),
                betweens(person.vitals.hunger, [
                    [HOUR_SECONDS * 16, 'You feel very weak with hunger.'],
                    [HOUR_SECONDS * 8, 'You feel weak with hunger.'],
                    [HOUR_SECONDS * 6, 'You are very hungry.'],
                    [HOUR_SECONDS * 4, 'You are hungry.'],
                    [HOUR_SECONDS * 1, null],
                    [0, 'You are full'],
                ]),
            ];
            return statuses.filter(Boolean).join('\n');
        },
        knowledge: {
            tiles: { [`${pos.x}:${pos.y}`]: 0 },
        },
        type: 'person',
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
        weight, //: 130,
        height, //: 70.5,
        // Is this too granular?
        // Maybe ignore the hooks for now?
        backpack: {
            pouch: {
                volume: 3, // square feet
                contents: [],
            },
            hooks: {
                count: 6,
                contents: [],
            },
        },
        autonomous: false,
        task: null,
        tick: (world, actor) => {
            if (actor.task && actor.task.name === 'sleep') {
                actor.vitals.hunger += 0.3;
            } else {
                actor.vitals.hunger += 1;
            }
            actor.vitals.thirst += 1;
            // hunger & thirst should go up when engaged in more vigorous activity
        },
        nextTask: (world, actor) => {
            if (!actor.autonomous) {
                return null;
            }

            throw new Error('not yet impl');
        },
    };

    return person;
};
