# Undercover

## Context

Small game I wanted to build to learn more about Svelte and web sockets. 

## Rules

This is a team (minimum 3 players, with at least 2 normal players), word guessing game where players’ identities are hidden from each other.
At the start of the game:
- Undercover: Receives a minor word which is similar to the major word (eg. walkie-talkie)
- Mr White: Has no word
- Normal Player (All other players): Receives a major word (eg. Handphone)

The identities of players are secret, even for players who are of the same identity. The game is played in rounds and each player has to describe the word which they received (they can't lie). No description of a word should be allowed more than once. At the end of each round, players would vote to eliminate 1 player which they think are undercovers or Mr whites.

When a Mr white gets eliminated, he has one chance to guess the right word, if he guesses right, he wins! Otherwise the game end if all the undercovers / Mr Whites are eliminated or when there is only 1 normal player left.

## Tips
The excitment is that no one really knows if they are a normal player or an Undercover. Vague descriptions are good to hide one’s identity. Yet, it may backfire as the majority may think a vague description only comes from an Undercover!
You may be thinking about Mr White now. He would have to describe the word at his best knowledge – based on the previous descriptions given by other players. If he manages to survive, he should be applauded!

## Link

https://uc.hashcode.dev