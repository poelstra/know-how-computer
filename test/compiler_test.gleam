import computer/compiler
import computer/instruction
import computer/program
import computer/source_map
import gleeunit/should

pub fn compiler_parses_simple_instructions_test() {
  compiler.compile(["inc 1", "dec 2"])
  |> should.be_ok
  |> should.equal(
    program.from_instructions([instruction.Inc(1), instruction.Dec(2)]),
  )
}

pub fn compiler_parses_example_program_test() {
  compiler.compile(["jmp 4", "inc 1", "dec 2", "isz 2", "jmp 2", "stp"])
  |> should.be_ok
  |> should.equal(
    program.from_instructions([
      instruction.Jmp(4),
      instruction.Inc(1),
      instruction.Dec(2),
      instruction.Isz(2),
      instruction.Jmp(2),
      instruction.Stp,
    ]),
  )
}

pub fn compiler_understands_nop_test() {
  compiler.compile(["inc 1", "nop", "dec 2"])
  |> should.be_ok
  |> should.equal(
    program.from_instructions([
      instruction.Inc(1),
      instruction.Nop,
      instruction.Dec(2),
    ]),
  )
}

pub fn compiler_skips_empty_lines() {
  compiler.compile(["inc 1", "", "dec 2"])
  |> should.be_ok
  |> should.equal(program.from_instructions_and_source_map(
    [instruction.Inc(1), instruction.Dec(2)],
    source_map.from_program_to_source([#(1, 1), #(2, 3)]),
  ))
}

pub fn compiler_rejects_unknown_commands_test() {
  compiler.compile(["inc 1", "foo", "bar"])
  |> should.be_error
  |> should.equal(compiler.CompileErrorInfo(
    error: compiler.UnknownCommand(got: "foo"),
    line: 2,
  ))
}

pub fn compiler_rejects_invalid_reg_argument_test() {
  compiler.compile(["inc 0"])
  |> should.be_error
  |> should.equal(compiler.CompileErrorInfo(
    error: compiler.RegisterNumberExpected(got: 0),
    line: 1,
  ))
}
