# Running list


- main character
  - [x] some fog of war
  - [x] move in direction
  - [ ] speed of moving over a tile should be related to the type (slower for forests)
  - [ ] make an "explore" action that just walks around randomly? to get started
  - [ ] make a mango tree n stuff
  - [ ] allow sleeping



- rabbits
    - [x] birth
    - [ ] death from hunger.... (track BMI, based on number of calories you get per day. eating short grass is harder than long grass probably? that might be hard to do)
    - [x] hmm it's not quite working. maybe I need to make traveling more expensive?
          what if, the farther you go, the more your hunger goes up?
    - [x] founding new warrens I think
    - [ ] "if you come across another warren, with fewer inhabitants, then join it with some probability"
    - [ ] tiles should know that they have a warren
    - [ ] tiles should record rabbit trails (amount of rabbit signs here, as a float is fine)
    - [ ] mango trees! Have mangos on them, various stages of ripeness. at a certain point they fall to the ground. on the ground they slowly go bad & decay.






# V0

Person:
    needs
    (sleep. sleep makes you rested. better sleep = more rested. quality of sleep depends on hardiness & quality of bed.)
    hardiness increases when you sleep on a poor quality bed.

    you can get woken up probably
    each hour is simulated while you're asleep.

    some change that you'll startle awake even if nothing happened.

Environment:
    land: start w/ just a circle probably
        all sand to start
    trees (random growth algo)
        stays away from the beach unless there's a cliff probably
    clearings probably
    spring & a stream going out to the ocean


# Person

knowledge about tiles, and how to get there
knowledge about what kinds of ground exist
and what kinds of ground are good for sleeping on

and then there's food
what is food

# Umm turn by turn text based?
What if I make it a turnbyturn text-based thing to start out, so I can get the feel for things?
then I make an AI for it, and go to town. Seems reasonable?

# Animal

....

(circadian rhythm?)
mmmm

probably won't sleep until evening.


# Tiles can contain:

Animals:
- rabbits
- boars
- birds (& eggs)
- snakes?
- raccoons (might steal your food?)
- owls?
- mice? voles?

Ground things:
- rabbit warrens
- boar nests I guess
- snakes holes
- rocks (might have to dig them up)
- twigs
- dead leaves (depending on the season?)
- herbs
- mushrooms
- droppings of various animals
- moss
- lichen on rocks probably
- streams! and rivers! hmm I need that in my map. water source is critical.
- undergrowth. shrubs. ivys/vines.
- roots

Tree things:
- birds nests
- racoon dens (in holes in trees or fallen logs)
- 

^ things have "noticability factor", where some things are immediately obvious,
and some things require you to be looking for it.
if you have greater observantness, more things become obvious.
this factor has a baseline by type of thing, but with some randomness thrown in to account for variability in how occluded a thing is.



# V1
different elevation, make it harder to travel up steep hills, need to know how to climb n stuff.