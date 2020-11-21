//

export default (pos, weight, height) => {
    const person = {
        pos,
        vitals: {
            injuries: {
                legs: null,
                arms: null,
                torso: null,
                head: null,
            },
            hunger: 0, // is this the right way to represent it?
            thirst: 0, // maybe it should be "how much food is in you"? or something
            long_energy: 100, // hmmmm
            energy: 100, // this is connected to tiredness, but not exactly the same.
            // but maybe for simplicity I'll just go with energy?
            // well, energy can replenish with resting, but tiredness can only reset with sleep.
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
            actor.vitals.hunger += 1;
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
