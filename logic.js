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

*/

const chooseWeighted = (rng, items, fn = (i) => i.weight) => {
    const totalWeight = items.reduce((t, m) => t + fn(m), 0);
    const d = rng.next() * totalWeight;
    let at = 0;
    for (let i = 0; i < items.length; i++) {
        at += fn(items[i]);
        if (at > d) {
            return i;
        }
    }
};

export const newPerson = (rng) => ({
    pos: { x: 0, y: 0 },
    hunger: 10,
    thirst: 0,
    tiredness: 0,
    backpack: [],
});

export const personNeeds = (world, person) => {
    const needs = [];
    if (person.hunegr > 5) {
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

// TODO: have this return a number, indicating "how good" it is at filling the need. so there's
// different desirability.
// also TODO:
export const meedsNeed = (item, need) => {
    if (need.type === 'eat') {
        return item.kinds.includes('edible');
    }
};

export const generatePlansForNeed = (world, person, need) => {
    // ok basic idea.
    // items have values associated with how much they meet a need.
    // so mango would have "needsMet: ['eat']" and "caloriesPerLb: 270"
    // for curiousity, it would be a special case, in that things would
    // only be counted if they haven't been seen before (the person would
    // start with a number of things built into their knowledge)
    const goals = Object.keys(items).filter((k) => meetsNeed(item[k], need));
};

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
            let steps = [];
            let failed = recipe.items.some((inner) => {
                let plans = generatePlansForItem(world, person, inner);
                if (!plans.length) {
                    return true;
                }
                const plan = chooseWeighted(
                    world.rng,
                    plans,
                    (plan) => 1 / plan.cost,
                );
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
    const need = chooseWeighted(world.rng, needs);
    const plans = generatePlansForNeed(world, person, need);
    const plan = chooseWeighted(world.rng, plans, (plan) => 1 / plan.cost);
    return plan;
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
