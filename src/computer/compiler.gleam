import computer/instruction.{type Instruction}
import computer/program.{type Program}
import gleam/int
import gleam/list
import gleam/result
import gleam/string

pub type CompileErrorInfo {
  CompileErrorInfo(error: CompileError, line: Int)
}

pub type CompileError {
  UnknownCommand(got: String)
  NoArgsExpected(got: String)
  IntArgExpected(got: String)
  RegisterNumberExpected(got: Int)
  AddressExpected(got: Int)
}

pub fn compile(lines: List(String)) -> Result(Program, CompileErrorInfo) {
  lines
  |> list.map(string.trim)
  |> list.map(string.lowercase)
  |> list.index_map(fn(line, line_no) {
    line
    |> parse_instruction
    |> result.map_error(fn(err) { CompileErrorInfo(err, line_no + 1) })
  })
  |> result.all
  |> result.map(program.from_instructions)
}

pub fn parse_instruction(line: String) -> Result(Instruction, CompileError) {
  let #(cmd, args) =
    line |> string.split_once(" ") |> result.unwrap(#(line, ""))
  case cmd {
    "" | "nop" -> args |> parse_none(instruction.Nop)
    "inc" -> args |> parse_reg(instruction.Inc)
    "dec" -> args |> parse_reg(instruction.Dec)
    "isz" -> args |> parse_reg(instruction.Isz)
    "jmp" -> args |> parse_addr(instruction.Jmp)
    "stp" -> args |> parse_none(instruction.Stp)
    _ -> Error(UnknownCommand(cmd))
  }
}

fn parse_reg(args: String, cb: fn(Int) -> a) -> Result(a, CompileError) {
  case int.parse(args) {
    Error(_) -> Error(IntArgExpected(args))
    Ok(n) if n >= 1 -> Ok(cb(n))
    Ok(n) -> Error(RegisterNumberExpected(n))
  }
}

fn parse_addr(args: String, cb: fn(Int) -> a) -> Result(a, CompileError) {
  case int.parse(args) {
    Error(_) -> Error(IntArgExpected(args))
    Ok(n) if n >= 1 -> Ok(cb(n))
    Ok(n) -> Error(AddressExpected(n))
  }
}

fn parse_none(args: String, a) -> Result(a, CompileError) {
  case args {
    "" -> Ok(a)
    _ -> Error(NoArgsExpected(args))
  }
}
