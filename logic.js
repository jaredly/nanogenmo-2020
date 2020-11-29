// hmm this is interesting

/*

Ok this feels like a promising direction.

So I generate a grid.

You start somewhere, with a bed.
You know that tile, and the bed.
You have needs.

When considering what to do next, consider your needs.

Then construct a tree of possible ways of fulfilling those needs, filtered by what is possible.
(in future, it will also be filtered by what you know how to do, but for now we assume omniscience).

The tree of possible ways will have "desirability" weights. Including "how likely they are to succeed" and "how well they will fill the need".
We then take a weighted random action, based on the results.




TODO need to model "preparation". e.g., collecting a bunch of fruits so that you can eat them from the
comfort of your bed, instead of going out and gathering.

*/

export const chooseWeighted = (rng, items, fn = (i) => i.weight) => {
    const totalWeight = items.reduce((t, m) => t + fn(m), 0);
    const d = rng.next() * totalWeight;
    let at = 0;
    for (let i = 0; i < items.length; i++) {
        at += fn(items[i]);
        if (at > d) {
            return items[i];
        }
    }
};

export const newPerson = (rng) => ({
    name: 'Olivia',
    pronouns: {
        subject: 'she',
        object: 'her',
        possessive: 'her',
        possessiveObject: 'hers',
    },
    pos: { x: 0, y: 0 },
    hunger: 10,
    thirst: 0,
    tiredness: 0,
    backpack: [],
    inHand: [],
    plan: null,
    narrative: [],
});

export const personNeeds = (world, person) => {
    console.log('person', person);
    const needs = [];
    if (person.hunger > 5) {
        needs.push({ type: 'eat', weight: person.hunger });
    }
    if (person.tiredness > 14) {
        needs.push({ type: 'sleep', weight: person.tiredness });
    }
    // TODO have these depend on recent actions too
    needs.push({ type: 'explore', weight: 1 });
    needs.push({ type: 'rest', weight: 1 });
    return needs;
};

// STOPSHIP TODO: give steps time lengths, and then call this
// when executing a step.
export const timeTick = (world, person, minutes) => {
    person.hunger += minutes / 60;
    person.thirst += minutes / 60;
    person.tiredness += minutes / 60;
};

// // TODO: have this return a number, indicating "how good" it is at filling the need. so there's
// // different desirability.
// // also TODO:
// export const meedsNeed = (item, need) => {
//     if (need.type === 'eat') {
//         // so what I want to do here,
//         // is have the need be "hunger",
//         // and instead of a bool here I return
//         // "a subset of steps".
//         // like ["obtain mango", "eat mango"]
//         // and then obtaim mango gets expanded out.
//         // right?
//         return item.kinds.includes('edible');
//     }
// };

export const generatePlansForNeed = (world, person, need) => {
    // ok basic idea.
    // items have values associated with how much they meet a need.
    // so mango would have "needsMet: ['eat']" and "caloriesPerLb: 270"
    // for curiousity, it would be a special case, in that things would
    // only be counted if they haven't been seen before (the person would
    // start with a number of things built into their knowledge)
    // const goals = Object.keys(items).filter((k) => meetsNeed(item[k], need));

    if (need.type === 'rest') {
        return [{ cost: 0, name: 'rest', steps: [{ type: 'rest' }] }];
    }

    if (need.type === 'explore') {
        const dirs = {
            north: [0, -1],
            south: [0, 1],
            east: [-1, 0],
            west: [1, 0],
        };
        const names = Object.keys(dirs);
        const dir = names[(world.rng.next() * names.length) | 0];
        // person.narrative.push(`${person.name} walked ${dir} to see what was over there.`)
        const nextPos = {
            x: person.pos.x + dirs[dir][0],
            y: person.pos.y + dirs[dir][1],
        };

        return [
            {
                cost: 10,
                name: 'explore',
                steps: [
                    { type: 'explore', dir },
                    { type: 'goTo', pos: nextPos },
                ],
            },
        ];
    }

    if (need.type === 'sleep') {
        return [
            {
                cost: 10,
                name: 'sleep',
                steps: [
                    // TODO require going back home
                    { type: 'sleep' },
                ],
            },
        ];
    }

    const plans = [];
    for (let key of Object.keys(items)) {
        if (
            need.type === 'eat' &&
            items[key].kinds &&
            items[key].kinds.includes('edible')
        ) {
            console.log('ok', items[key]);
            const itemPlans = generatePlansForItem(world, person, items[key]);
            if (itemPlans.length) {
                const plan = chooseWeighted(
                    world.rng,
                    itemPlans,
                    (plan) => 1 / (plan.cost + 1),
                );
                plans.push({
                    cost: plan.cost,
                    name: 'eat-food',
                    steps: [plan, { type: 'eat', item: items[key] }],
                });
            }
        }
    }

    // are items the only things that meet needs?
    // or are there other ways?
    // anyway, that's all for now folks.
    return plans;
};

// STOPSHIP
const movementCost = (world, person, pos) => 1;

/**
 * Plans for how to get this item.
 */
export const generatePlansForItem = (world, person, item) => {
    const plans = [];

    // if it's in your backpack
    const found = person.backpack.find((inner) => inner.type === item.type);
    if (found != null) {
        plans.push({
            cost: 0,
            name: 'have-in-backpack',
            steps: [{ type: 'removeFromBackpack', item: found }],
        });
    }

    // if it's on the ground somewhere (cost = cost of movement)
    // steps = go to place, and pick it up
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            const found = tile.movable.find((t) => t.type === item.type);
            if (found != null) {
                const pos = { x, y };
                plans.push({
                    cost: movementCost(world, person, pos) + 1,
                    name: 'go-pickup',
                    steps: [
                        { type: 'goTo', pos },
                        { type: 'pickUp', item: found },
                    ],
                });
            }
        });
    });

    // if it can be created from other items [recipe], obtain those items
    if (item.recipes) {
        item.recipes.forEach((recipe) => {
            let totalCost = recipe.cost;
            // TODO: maybe randomize the order that we go get the things in?
            let steps = [];
            let failed = recipe.items.some((inner) => {
                const plans = generatePlansForItem(
                    world,
                    person,
                    items[inner.type],
                );
                if (!plans.length) {
                    return true;
                }
                const plan = chooseWeighted(
                    world.rng,
                    plans,
                    (plan) => 1 / (plan.cost + 1),
                );
                totalCost += plan.cost;
                steps.push({ type: 'obtain-recipe-ingredient', plan });
            });
            if (!failed) {
                plans.push({
                    cost: totalCost,
                    name: 'make-from-recipe',
                    steps,
                });
            }
        });
    }

    // if it can be derived from a landscape (non-movable) item, go to a tile with that item
    if (item.sources) {
        item.sources.forEach((source) => {
            const plans = generatePlansForLandFeature(
                world,
                person,
                landFeatures[source.type],
            );
            if (!plans.length) {
                return;
            }
            const plan = chooseWeighted(
                world.rng,
                plans,
                (plan) => 1 / (plan.cost + 1),
            );
            plans.push({
                cost: plan.cost + source.cost,
                name: 'derive-from-source',
                plan,
            });
        });
    }

    return plans;
};

export const generatePlansForLandFeature = (world, person, item) => {
    // if we know of a tile with it, go for it
    const plans = [];
    world.tiles.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile.landscape.find((t) => t.type === item.type) != null) {
                const pos = { x, y };
                plans.push({
                    cost: movementCost(world, person, pos),
                    steps: [{ type: 'goTo', pos }],
                });
            }
        });
    });

    // TODO add exploration and fog of war
    return plans;
};

export const nextPlan = (world, person) => {
    const needs = personNeeds(world, person);
    console.log('needs', needs);
    const need = chooseWeighted(world.rng, needs);
    console.log('need', need);
    const plans = generatePlansForNeed(world, person, need);
    console.log('plans', plans);
    if (!plans.length) {
        throw new Error(`No plans!`);
    }
    const plan = chooseWeighted(
        world.rng,
        plans,
        (plan) => 1 / (plan.cost + 1),
    );
    return plan;
};

export const planSteps = {
    sleep: (world, person, step) => {
        person.narrative.push({
            type: 'sleep',
            text: `${person.name} was so tired they lay down on the ground and slept.`,
        });
        timeTick(world, person, 60 * 5);
        person.tiredness = 0;
    },
    rest: (world, person, step) => {
        person.narrative.push({
            type: 'rest',
            text: `${person.name} rested for a while.`,
        });
        timeTick(world, person, 30);
    },
    explore: (world, person, step) => {
        // const dirs = {'north': [0,-1], 'south': [0,1], 'east': [-1, 0], 'west': [1, 0]}
        // const names = Object.keys(dirs)
        // const dir = names[world.rng.next() * names.length | 0]
        person.narrative.push({
            type: 'explore',
            text: `${person.name} looked ${step.dir} to the forest. ${person.pronouns.subject} wondered what was over there.`,
        });
    },
    goTo: (world, person, step) => {
        // TODO add an item to the list of things
        person.pos = step.pos;
        // STOPSHIP WORK HERE. ASSEMBLE A NARRATIVE PLEASE
        // DUNNO HOW. MAYBE JUST DO HARDCODED SENTENCES FOR THE MOMENT
        person.narrative.push({
            type: 'goTo',
            text: `${person.name} walked for a while to ${step.pos.x},${step.pos.y}.`,
        });
        timeTick(world, person, 10);
    },
    pickUp: (world, person, step) => {
        const { x, y } = person.pos;
        const tile = world.tiles[y][x];
        const found = tile.movable.filter((m) => m.type === step.item.type);
        if (!found.length) {
            return false;
        }
        person.inHand.push(found[0]);
        tile.movable = tile.movable.filter((m) => m !== found[0]);
        person.narrative.push({
            type: 'pickUp',
            text: `${person.name} picked up ${
                found.length === 1 ? 'the' : 'a'
            } ${step.item.type}.`,
        });
    },
    eat: (world, person, step) => {
        const found = person.inHand.find((t) => t.type == step.item.type);
        if (!found) {
            return false;
        }
        person.inHand = person.inHand.filter((t) => t !== found);
        person.hunger -= 10;
        person.narrative.push({
            type: 'eat',
            text: `${person.name} ate the ${found.type}.`,
        });
    },
};

export const executePlan = (world, person, plan) => {
    console.log('>> execute', plan);
    plan.steps.forEach((step) => {
        if (step.name != null) {
            return executePlan(world, person, step);
        }
        if (!planSteps[step.type]) {
            console.log(`>> No way to execute ${step.type}`);
            console.log(step);
        } else {
            console.log(`>> Executing ${step.type}`);
            const success = planSteps[step.type](world, person, step);
            if (success == false) {
                throw new Error('failed to execute');
            }
        }
    });
};

// class Person {
//     needs(world) {
//         const needs = [];
//         if (this.hunger > 5) {
//             needs.push('eat');
//         }
//         if (this.tiredness > 5 || world.hourOfDay > 20) {
//             needs.push('sleep'); // how to indicate priority?
//         }
//         needs.push('explore');
//         // if you've found the thing, then add 'escape' to the list
//     }
// }

export const landFeatures = {
    mangoTree: {
        kinds: ['tree', 'disiduous', 'fruitTree'],
    },
    oakTree: {
        kinds: ['tree', 'disiduous'],
    },
    reeds: {
        location: 'pond',
    },
    willow: {
        location: ['river', 'stream'],
    },
};
Object.keys(landFeatures).forEach((k) => (landFeatures[k].type = k));

// crafting things probably takes skill
// if you fail to craft, you ruin some material
export const items = {
    mango: {
        kinds: ['edible', 'fruit'],
        caloriesPerPound: 270,
        source: 'mangoTree',
    },
    // TODO make these "droppables" automatic. e.g.
    // when generating a tile, don't hardcode "oak tree and oak leaves",
    // but look at the items we have, and choose some.
    oakLeaves: {
        kinds: ['kindling'],
        density: 0.2,
    },
    oakTwigs: {
        kinds: ['kindling'],
        density: 0.4,
    },
    oakBranch: {
        density: 0.4,
        kinds: ['firewood', 'stick'],
        burnPerVolume: 50,
    },
    oakBark: {
        kinds: ['bark', 'kindling'],
        source: 'oakTree',
    },

    willowFibers: {
        kinds: ['fibers', 'kindling'],
        source: 'willow',
    },
    reedFibers: {
        kinds: ['fibers', 'kindling'],
        source: 'reeds',
    },
    fish: {
        location: ['river', 'stream'],
        kind: [{ type: 'edible', caloriesPerPound: 500 }],
    },
    birchLogs: {
        source: [
            { type: 'birch tree', tool: ['saw', 'axe'] },
            // how to indicate that a given source has a limited number of these?
            'dead birch tree',
        ],
        kinds: ['firewood'],
    },
    wovenBasket: {
        kinds: ['carry', 'catch fish'],
        ingredients: [{ kind: 'reeds', count: 20 }],
    },
    clayPot: {
        kinds: ['carry', 'carry-water'],
        ingredients: ['clay'],
        tools: ['kiln-on'],
    },
};
Object.keys(items).forEach((k) => (items[k].type = k));

const actions = {
    exploreForMangos: {
        preq: { location: 'nearby-unknown' }, // not sure how to express that.
        reward: [{ own: 'mangos', chance: 0.2 }],
        time: 60 * 2, // how to express a range idk
    },
    sleepOnGround: {
        preq: { location: 'dry' },
        reward: { rested: 10 },
    },
    sleepOnBed: {
        preq: { location: 'bed' },
        reward: { rested: 30 },
    },
    eatFish: {
        preq: { own: 'cooked-fish' },
        reward: { hungry: false },
    },
    cookFish: {
        preq: { own: 'fish', location: 'campfire' },
        reward: { own: 'cooked-fish' },
    },
    makeCampfile: {
        preq: { own: 'tinder', own: 'flint&steel', own: 'firewood' },
        reward: { location: 'camptfile' },
    },
    gatherTinder: {
        preq: { location: 'forest' },
        reward: { own: 'tinder' },
    },
    gatherFirewood: {
        preq: { location: 'dead tree' },
        reward: { own: 'firewood' },
    },
    getFish: {
        preq: { own: 'basket' },
        reqard: { own: 'fish' },
    },
    getBasket: {
        preq: { own: 'fibers' },
        reward: { own: 'basket' },
    },
    getReedFibers: {
        preq: { location: 'reeds' },
        reward: { own: 'fibers' },
    },
    getWillowFibers: {
        preq: { location: 'willow' },
        reward: { own: 'fibers' },
    },
    eatMangos: {
        preq: { own: 'mangos' },
        reqard: { hungry: false },
    },
};
