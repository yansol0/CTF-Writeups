#	Wizardlike - Reversing - 500 Points

Wizardlike was the final challenge in the reversing category.
It's presentation was certainly interesting, as the core functionality of this binary was a mini ascii-art game. Your character could move up and down floors, with 3 levels available to us initially, but it was easy enough to tell that there were areas that we weren't allowed to reach under normal circumstances.

### TL;DR
1. Disassemble the binary using ghidra
2. Find the function responsilbe for checking map boundaries and determining if your character can move.
3. Patch that function in the binary, so that you are free to go anywhere on the map.

### Introduction
Once analysed with Ghidra, there was one particular function that stood out to me because some of the parameters that were being passed into some of the functions contained what appeared to be ascii-art of walls and ceilings used in the game.

![main function disassembly](screenshots/main.png?raw=true)

As movement in this game is controlled by WASD keys, it was easy to spot the block of code responsible for handling movement further down in that same function (hex values were "q" which quit the game, "w", "a", "s", "d"):

	iVar5 = wgetch();
    if (iVar5 == 0x51) {
      bVar1 = false;
    }
    else if (iVar5 == 0x77) {
      FUN_0010166b();
    }
    else if (iVar5 == 0x73) {
      FUN_001016e7();
    }
    else if (iVar5 == 0x61) {
      FUN_00101763();
    }
    else if (iVar5 == 100) {
      FUN_001017df();
    }


At this point I had enough information to start cleaning up Ghidra's disassembly view and renaming functions and variables to make it more readable. 

### Finding the constraints

Following the logic of the movement functions, I found what appeared to be the function responsible for checking if the player was allowed to move or not after hitting a key - it was called by each individual movement function (for each key in WASD). If the output of that function wasn't 0, the player was allowed to move.

![movement function disassembly](screenshots/movement.png?raw=true)

![boundary function](screenshots/boundary.png?raw=true)


So knowing that the only condition that determined if a player was allowed to move was controlled by this function - assembly instructions of which can be seen on the left in the screenshot above - all that was left to do was to do was to open the binary in a hex editor (or Ghidra itself), find the offsets of those assembly instructions, find the instructions, and patch their values - so that the function would always return 1, meaning the player would be allowed to move anywhere on the map.

![patched values](screenshots/values.png?raw=true)

(The offsets in this case were 1656, 165d and 1664 as seen in the screenshots, and finding the instructions in a hex editor meant looking for a sequence of bytes which matched the instructions corresponding to the function's output - b8 00 and so on. Patching the 00s to 01s was all that was needed in this case.)

![flag](screenshots/patched.png?raw=true)

So finally after running the patched version of the game, we were able to move freely throughout the map, going through walls and other obstacles, and reaching the remaining 7 or so levels in the game.

![flag](screenshots/pico.png?raw=true)


