import computer/instruction.{type Instruction}
import computer/program.{type Program}
import computer/source_map
import gleam/bool
import gleam/int
import gleam/list
import gleam/pair
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
  |> list.index_map(fn(line, idx) { #(idx + 1, line) })
  |> list.map(strip_comment)
  |> list.filter(filter_empty)
  |> list.map(parse_line)
  |> result.all
  |> result.map(to_program)
}

fn parse_line(
  line: #(Int, String),
) -> Result(#(Int, Instruction), CompileErrorInfo) {
  let #(line_no, text) = line
  case parse_instruction(text) {
    Ok(instruction) -> Ok(#(line_no, instruction))
    Error(err) -> Error(CompileErrorInfo(err, line_no))
  }
}

fn strip_comment(line: #(Int, String)) -> #(Int, String) {
  let #(line_no, text) = line
  let text = case text |> string.split_once("//") {
    Ok(#(code, _comment)) -> code |> string.trim
    _ -> text
  }
  #(line_no, text)
}

fn filter_empty(line: #(Int, String)) -> Bool {
  line.1 |> string.trim |> string.is_empty |> bool.negate
}

fn to_program(lines: List(#(Int, Instruction))) -> Program {
  let instructions = lines |> list.map(pair.second)
  let program_to_source =
    lines
    |> list.index_map(fn(source_line, program_idx) {
      let #(source_line_no, _) = source_line
      #(program_idx + 1, source_line_no)
    })
  let sm = source_map.from_program_to_source(program_to_source)
  program.from_instructions_and_source_map(instructions, sm)
}

pub fn parse_instruction(line: String) -> Result(Instruction, CompileError) {
  let #(cmd, args) =
    line |> string.split_once(" ") |> result.unwrap(#(line, ""))
  case cmd {
    "nop" -> args |> parse_none(instruction.Nop)
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

pub fn compile_error_to_string(error: CompileError) -> String {
  case error {
    UnknownCommand(got) -> "UnknownCommand, got '" <> got <> "'"
    NoArgsExpected(got) -> "NoArgsExpected, got '" <> got <> "'"
    IntArgExpected(got) -> "IntArgExpected, got '" <> got <> "'"
    RegisterNumberExpected(got) ->
      "RegisterNumberExpected, got '" <> int.to_string(got) <> "'"
    AddressExpected(got) ->
      "AddressExpected, got '" <> int.to_string(got) <> "'"
  }
}
