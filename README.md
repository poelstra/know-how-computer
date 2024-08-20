# Know How Computer

Ever wanted to know how a computer really works?

First, go try out the paper version of the [Know How Computer](https://en.wikipedia.org/wiki/WDR_paper_computer)
(also called WDR Paper Computer)! It makes _you_ the computer, and gives you a better
understanding of how a 'real' computer works.

After a paper program or two, though, you'll probably get bored of the manual work.
In that case, my emulator is for you:

[Know How Computer emulator](https://poelstra.github.io/know-how-computer/)

See the [Examples](#examples) and [Challenges](#challenges) below to have a go yourself!

## Features

- Full support of the Know How Computer instruction set! 😂
- Instruction stepping and run to completion (or breakpoint)
- Placing breakpoints (click before the line number)
- Step back / undo
- Comments / empty lines
- Labels (for `jmp`)
- Arbitrary number of registers, changing registers on-the-fly

## Quick start / usage

Copy one of the examples below, enter some values in the registers, and press the Step or Run button.

Note that you can add as many registers as you like by simply adding more lines.
Any registers that you set _before_ pressing Step or Run (i.e. when the computer is
still in "Ready" state), will be restored when you press Reset.

You can add a breakpoint on any (instruction) line by clicking in the gutter before
the line number. Pressing Run will then run as far as it can until it either hits
`stp` or a breakpoint.

## Instruction set

The Know How Computer supports the following instructions:

- `inc <register>`: Add 1 to the contents of the given register.
- `dec <register>`: Subtract 1 from the contents of the given register.
- `jmp <address>`: Jump to the instruction at the given address (line number).
- `isz <register>`: Check whether the given register is zero. If it is, skip the next instruction, otherwise just continue.
- `stp`: Halt the program (i.e. stop further running).

Instructions can be written in lower, upper or even mixed case (so `inc`, `INC`, `Inc` are all OK).

The emulator additionally supports the following:

- `nop`: Instruction to do nothing (surprisingly common in real computers...).
- `:<label_name>`: Give a name to the next instruction's address, which can then be used in `jmp` instructions.
- `// <some comment>`: A comment, ignored by the compiler (also after instructions / labels).

Don't be fooled by the appareny simplicity of these instructions! 'Real' processors do use
instructions like this (although they support many more).

For example, take a look at the [`INC` instruction of an AVR processor](https://ww1.microchip.com/downloads/en/devicedoc/atmel-0856-avr-instruction-set-manual.pdf#_OPENTOPIC_TOC_PROCESSING_d94e22088), which is used in the highly popular Arduino boards.

[Wikipedia](https://en.wikipedia.org/wiki/Atmel_AVR_instruction_set#Instruction_list) also has a nice overview of the instructions of that processor.

### Instruction numbers, line numbers and labels

In the Know How Computer, every line contains an instruction. So in that case, a `jmp 2`
always jumps to the second instruction (and thus line) of the program.

Because this emulator also supports comments, empty lines and labels, not every line
is an instruction, and it would become quite hard to keep a count of what the instruction
number is on any line in the program.

To make it easier to see where a jump will go to, the compiler treats any jump address
as a _line_ number, and will internally translate it to the correct _instruction_ number.

As a silly example, the following program is an infinite loop, because the `jmp 2` goes to the
second _line_ (which contains the jump), not the second _instruction_ (which is the `stp`):

```assembly
// This program is an infinite loop
jmp 2
stp
```

Because it's common to want to add/remove lines in your program, you'd constantly need to
update all jump addresses. Therefore, you can also use labels, like so:

```assembly
jmp my_label // This jumps to line 4 (`stp`)
nop          // This line is never executed
:my_label    // This names the next instruction "my_label"
stp
```

## Examples

### Final count down

Copy the code below to the program editor (the bottom one), put a number (e.g. `3`)
in the first register (in the top editor), then press the Step button until the program
reaches the end ("Stopped at ..."). Click the Reset button to start over.

```assembly
dec 1   // Decrement register 1
isz 1   // Is register 1 zero?
jmp 1   //   -> no: go to line 1
stp     //   -> yes: done
```

Note: this version of the program has a bug, see the [Loophole challenge](#loophole) below
to crack it!

### Sum like it hot

The following example builds on the concept of the previous one,
but this time, the contents of register 2 are added to register 1.

```assembly
jmp 4   // Jump to line 6 (`isz 2`)
inc 1   // Increment register 1
dec 2   // Decrement register 2
isz 2   // Is register 2 zero?
jmp 2   //   -> no: go to line 2
stp     //   -> yes: done
```

If you add or remove lines above, you'll need to re-adjust the `jmp`
addresses. Use labels to let the compiler figure out the numbers for you:

```assembly
jmp compare   // Jump to line 6 (`isz 2`)
:loop         // Name the next line 'loop'
inc 1         // Increment register 1
dec 2         // Decrement register 2
:compare      // Name the next line 'compare'
isz 2         // Is register 2 zero?
jmp loop      //   -> no: go to line 3
stp           //   -> yes: done
```

## Challenges

The best way to really learn some concepts, is to just play with them yourself.
Can you solve the challenges below? Have fun! 😀

### Loophole

As mentioned in the first example, it contains a bug. Put a 0 (zero) in
register 1 and click Run. What happens?

Can you fix it?

<details>
<summary>Hint 1</summary>
You can fix it by inserting a single instruction (and updating the `jmp` at the end).
</details>

<details>
<summary>Hint 2</summary>
Take a close look at the first instruction of the "Sum like it hot" example.
</details>

### Copy-cat

So far, our programs have left the registers in a modified state after the program
completes. For example, in "Sum like it hot", register 2 ends up being zero.

Create a program that (after it completes) has copied register 1 to register 2.

For example, when starting with a 3 in register 1, and a 0 in register 2, it should
end up with a 3 in both registers. (It's fine to modify register 1 during the program,
as long as it returns to its initial state when the program ends.)

<details>
<summary>Hint</summary>
You'll need a third register for temporary book-keeping.
</details>

Can you also improve your program such that register 2 is allowed to start with
a non-zero value? I.e. 3 and 4 in register 1 and 2 should lead to 3 and 3 after
completion.

### Sum like it hotter

Building on the "Sum like it hot" example and the challenges before, can you
program the computer to put the sum of registers 1 and 2 in register 3?

Registers 1 and 2 should keep their original values. Make sure to clear out
register 3 first.

For example, starting with values 3, 4 and 1 in registers 1, 2 and 3, after running,
the program should have 3, 4 and 7 in these registers.

Tip: use empty lines, comments and labels to structure your program, and make it
easier to follow. For example, use labels like `:clear_reg_3_loop` and
`:clear_reg_3_compare`.

<details>
<summary>Hint 1</summary>
Always start thinking about the high level steps to perform.
What registers need to be cleared? What registers need to be copied from where to where?
What registers then need to be summed together?
</details>

<details>
<summary>Hint 2</summary>
One solution is to copy registers 1 to 3, then 2 to 4 (using register 5 as the
'temporary bookkeeping'), and then adapt the code from "Sum like it hot" to add
register 4 to register 3.
</details>

### Trade-offs

There are multiple ways to solve the previous challenge, each with their
pros and cons.

How many registers did your solution to [Sum like it hotter](#sum-like-it-hotter) use?

- **5 or more registers**: You most likely applied the concepts of the examples
  and previous challenges as building blocks such as "copy register 1 to register 3".

  This makes it easier to write other, more complex programs. However, this came at
  the expense of more registers being used, and more instructions to be executed.

  Can you come up with a solution that uses only 4 registers?

- **4 registers**: You have probably used some of the example and previous challenge
  code as building blocks, but also written some more specific pieces, like "copy
  register 2 to register 4, while at the same time also adding it to register 3".

  This leads to more efficient usage of registers and number of instructions to be executed,
  at the expense of such code not being as re-usable to solve other problems. Also,
  code that does multiple things at once is often harder to understand.

  Can you come up with a solution that uses only the blocks from the earlier challenges
  and exercises? Use hint 2 in the previous challenge if needed.

Now you wrote two different solutions to the same problem, which one did you like better?
Why?

## Development (of the Know How Computer itself)

You'll need Gleam (tested with version 1.4.1) and NodeJS (tested with version v20.16.0).

```sh
# Obtain and build codemirror and its FFI
npm install
npm run build
gleam test # Run the tests
gleam run -m lustre/dev start # Start the dev server
```

## Why?

I wanted to teach my kids how computers 'really work', and what better
approach than to 'be' the computer (in the paper version)?
Programs of more than a few lines become rather tedious to write and execute
though, which spoiled the fun a bit.

At that same time, I ran across the lovely [Gleam](https://gleam.run) programming
language and wanted to learn that myself.

So, here we are with a Know How Computer written in Gleam.

## Acknowledgements

Thanks to the friendly people in the Gleam discord (notably Hayleigh) for their
quick suggestions on my initial Gleam adventure!

## TODO

Some wild ideas in no particular order (and which I may never actually get to):

- [x] Write some examples / challenges
- [ ] Persist program and registers in local storage
- [x] Provide (statically) hosted version of this
- [x] Build the hosted version automatically from Github Actions
- [ ] Learn more Gleam & improve the code base with it
- [ ] Add tab/view to show compiled output
- [x] Visualize 'history' by having a trace of shaded line markers
- [ ] Dutch translation
- [ ] Gradually add more advanced concepts (stack, memory, more advanced instructions, basic I/O)
- [ ] Implement an integrated learning journey similar to [Exercism](https://exercism.org/) or [Hedy](https://hedycode.com), i.e. narrated exercises, automated test runners and multiple 'levels'.

## License

MIT

Copyright (C) 2024 Martin Poelstra
