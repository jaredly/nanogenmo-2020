

# Logic world, I'm loving it.

## Next step: you have hunger!
it gradually increases, but you can eat things to slake it.
so, 'next step' can be one of 'do something about hunger', or 'rest'

to 'do something about hunger', you consult your tree of possible solutions,
including "your knowledge of where things are".
So you'll have:
knowledge: {
    'mango': {source: 'mango-tree'},
    'mango-tree': {
        locations: [0,0; 0,3; 4,4]
    }
}
and then you choose the one closest to you, and go to it.
then you pick the fruit.

So at any given time you'll have a "plan", outlining what you think you need to do.
if something interrupts you, you might need to form the plan all over again? idk.
















# Ok, what's the simplest playable setup I can think of?

Very simple
- basic fog of war, you have perfect memory.
- there are fruit trees with food, the food grows slow enough that you have to find other trees
- there are fish you can catch I guess ... with a basket? hm also complicated
- ok, so I don't need to work out all the details.
we need basic reasoning.
GOALS
ACTIONS
PREREQUISITES

GOALS = (rest, satisfy hunger, satisfy thirst)
ACTIONS =
- sleep : prerequisite, have a place to sleep. some places are better than others. if you know of a better place to sleep that's not too far away, then go there.
- eat fish : need to catch fish
- catch fish : need to have a basket
- make basket : need to gather reeds or fibers
- eat mangos : need to pick mangos
- pick mangos : need to be next to a mango tree with mangos, e.g. need to know where a mango tree is
- if all else fails, and you can't satisfy any needs, then exploring is a way to get new knowledge.

e.g. "I don't know where a mango tree is, but if I explore, I might find one".
"I don't know where a stream with fish is, but if I explore, I might find one".
"I don't know where a nice place to sleep is, but if I explore, I might find one".

Yeah, that's the basics.

So, perfect memory for now.










- movement (you can remember a place, you can find your way there. tiles have exponential decay - if you traverse it multiple times, that boosts the memory. and each time it gets boosted ... )
    - so to start out, you make yourself a bed
    - and then you go find food (stopping as soon as you find it)
    - then you go home.
    - the last N tiles you've traveled, you can remember. (large enough that you can find your way back when exploring?)
    - hm but how do you explore farther than that? ugh in real life it would be by following a river or something.
    - so maybe I just have a really long decay? like you can remember places you've been for a couple of days?
    - and if you traverse a tile enough times, it gets solidified into long-term memory?
    - ermm this is really complex.
- eating
    - you recognize some foods, you don't recognize others? maybe
    - 

