//

import {
    addPos,
    dist,
    diff,
    posKey,
    posEq,
    tileAt,
    validPos,
} from './utils.js';
import { dirs } from './world.js';

class Endless {
    constructor() {}
    advance(world, tile) {
        return 0;
    }
    followUp(world) {
        return null;
    }
}

class Timer {
    constructor(time) {
        this.time = time;
    }
    update(world, time) {}
    followUp(world) {
        return null;
    }
    advance(world, time) {
        const elapsed = Math.min(time, this.time);
        this.update(elapsed);
        if (time >= this.time) {
            this.time -= elapsed;
            console.log('>Done', time, this.time);
            return time - elapsed;
        }
        this.time -= elapsed;
        return 0;
    }
}

const wait = (hours) => new Timer(hours);

// class Sleep extends Timer {}

class Actor {
    constructor() {
        this.tasks = [];
    }

    nextTask() {
        return null;
    }

    // Hunger levels, etc.
    // Might add things to the task list
    statusUpdates(world, time) {}

    tick(world, time) {
        this.statusUpdates(world, time);
        if (this.tasks.length === 0) {
            let nextTask = this.nextTask(world);
            console.log('Next task?', nextTask);
            if (nextTask == null) {
                nextTask = wait(1);
            }
            if (Array.isArray(nextTask)) {
                this.tasks.push(...nextTask);
            } else {
                this.tasks.push(nextTask);
            }
        }
        // console.log('Tick', time, this.tasks[0]);
        const timeLeft = this.tasks[0].advance(world, time);
        console.log('Time left', timeLeft);
        if (timeLeft == 0 || timeLeft < 0.000001) {
            // console.log('not done', timeLeft, this.tasks[0]);
            return;
        }
        const finished = this.tasks.shift();
        const follow = finished.followUp(world);
        // if (time < this.tasks[0].time) {
        //     this.tasks[0].advance(time)
        //     this.tasks[0].time -= time
        //     return
        // }
        // console.log('finished', finished);
        if (follow) {
            console.log('follow-up', finished, follow);
            if (Array.isArray(follow)) {
                this.tasks.unshift(...follow);
            } else {
                this.tasks.unshift(follow);
            }
        }
        this.tick(world, timeLeft);
    }

    isSleeping() {
        return this.tasks.length && this.tasks[0] instanceof Sleep;
    }
}

// class Move extends Timer {
//     constructor()
// }

export class Sleep extends Endless {
    constructor(rabbit) {
        super();
        this.rabbit = rabbit;
    }
    advance(world, time) {
        const timeSpent = Math.min(time, this.rabbit.tiredness);
        this.rabbit.tiredness -= timeSpent;
        return time - timeSpent;
    }
}

export class Graze extends Endless {
    constructor(rabbit) {
        super();
        this.rabbit = rabbit;
    }
    advance(world, time) {
        const tile = tileAt(world, this.rabbit.pos);
        // abort folks
        if (tile.type !== 'grass') {
            return time;
        }
        // too short, wont eat
        if (tile.grassHeight < 1) {
            return time;
        }
        // too full, wont eat
        if (this.rabbit.hunger < 0.5) {
            return time;
        }
        // STOPSHIP: I think we'll want to sub-tick by 10 minute increments or something
        // so that one rabbit doesn't eat a whole hours-worth of grass while the others don't get any.
        const available = tile.grassHeight - 1;
        // console.log(available, time);
        // 0.1 inch per hour
        const eat = Math.min(time * 0.1, available);
        const eatPerHunger = 3; // not sure what the units are here :::
        const hunger = Math.min(eat / eatPerHunger, this.rabbit.hunger);
        // if (hunger > this.hunger)
        tile.grassHeight -= hunger * eatPerHunger;
        this.rabbit.hunger -= hunger; // so we need to eat for 10 hours? 1 hour, .1 inches. 6 hours of eating should be enough.
        const timeTook = hunger * eatPerHunger * 10;
        // console.log(timeTook, time, this.rabbit.hunger, hunger);
        return time - timeTook;
    }
}

class LookForFood extends Endless {
    constructor(rabbit) {
        super();
        this.rabbit = rabbit;
        this.next = null;
    }

    advance(world, time) {
        const neighbors = dirs
            .map((dir) => addPos(this.rabbit.pos, dir))
            .filter((pos) => validPos(world, pos))
            .filter((pos) => tileAt(world, pos).type !== 'water');
        if (!neighbors.length) {
            return time;
        }
        const grass = neighbors
            .filter((pos) => tileAt(world, pos).type === 'grass')
            .sort(
                (a, b) =>
                    tileAt(world, b).grassHeight - tileAt(world, a).grassHeight,
            );
        if (grass.length) {
            this.next = grass[0];
        } else {
            this.next = neighbors[world.rng.next() * neighbors.length];
        }
        return time;
    }

    followUp(world) {
        // console.log('follow yall');
        if (this.next != null) {
            // console.log(this.next);
            return new GoToward(this.rabbit, this.next, 0.1);
        } else {
            return new Timer(1);
        }
    }
}

const nextPos = (current, dest) => {
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

class GoToward extends Timer {
    constructor(rabbit, dest, time) {
        super(time);
        this.rabbit = rabbit;
        this.dest = dest;
        this.next = nextPos(rabbit.pos, dest);
        this.walkTime = time;
        // console.log('go', dest, time);
    }
    followUp(world) {
        // console.log('next go', this.next, this.dest);
        this.rabbit.pos = this.next;
        if (!posEq(this.next, this.dest)) {
            return new GoToward(this.rabbit, this.dest, this.walkTime);
        }
    }
}

// class GoToward extends Endless {
//     constructor(rabbit, dest) {
//         this.rabbit = rabbit;
//         this.dest = dest;
//     }
//     advance(world, time) {}
// }

export class Rabbit extends Actor {
    constructor(weight, age, pos) {
        super();
        this.weight = weight;
        this.age = age;
        this.pos = pos;
        this.home = pos;
        // if hunger is above 1, look for food.
        // if it's below 0.5 and current grass patch is depleted, rest
        this.hunger = 1;
        // after 12 hours of being awake, 12 hours of sleeping.
        this.tiredness = 0;
    }

    statusUpdates(world, time) {
        // console.log('hello', this.tasks[0], this.hunger, this.tiredness);
        if (
            !(
                this.tasks.length &&
                (this.tasks[0] instanceof Graze ||
                    this.tasks[0] instanceof LookForFood ||
                    this.tasks[0] instanceof GoToward ||
                    this.tasks[0] instanceof Sleep)
            )
        ) {
            this.hunger += time * 0.1;
            if (this.hunger > 1.0) {
                const tile = tileAt(world, this.pos);
                if (tile.type === 'grass' && tile.grassHeight > 1) {
                    console.log('on grass', tile);
                    this.tasks.unshift(new Graze(this));
                } else {
                    console.log('not on grass', tile);
                    this.tasks.unshift(new LookForFood(this));
                }
            }
        }
        if (!(this.tasks.length && this.tasks[0] instanceof Sleep)) {
            this.tiredness += time;
        }
    }

    nextTask(world) {
        if (this.tiredness >= 12) {
            console.log('Sleepy! go home');
            // TODO go home ur drunk
            if (posEq(this.pos, this.home)) {
                return new Sleep(this);
            }
            return new GoToward(this, this.home, 0.1);
        }
        if (this.hunger > 1.0) {
            const tile = tileAt(world, this.pos);
            if (tile.type === 'grass' && tile.grassHeight > 1) {
                return new Graze(this);
            } else {
                return new LookForFood(this);
            }
        }
    }
}
