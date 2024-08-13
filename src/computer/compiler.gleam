import computer/instruction.{type Instruction}
import computer/program.{type Program}
import computer/source_map
import gleam/bool
import gleam/dict
import gleam/int
import gleam/list
import gleam/pair
import gleam/regex
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
  DuplicateLabel(previous: Int)
  InvalidIdentifier(got: String)
  UnknownLabel(got: String)
  LabelWithoutInstruction(got: String)
}

type CompileInstruction {
  DirectInstruction(instruction: Instruction)
  NamedJump(label: String)
}

pub fn compile(lines: List(String)) -> Result(Program, CompileErrorInfo) {
  let max_lines = list.length(lines)
  let stripped_lines =
    lines
    |> list.map(string.trim)
    |> list.map(string.lowercase)
    |> list.index_map(fn(line, idx) { #(idx + 1, line) })
    |> list.map(strip_comment)
    |> list.filter(filter_empty)

  let labels_result =
    stripped_lines
    |> list.filter(line_is_label)
    |> list.map(pair.map_second(_, string.drop_left(_, 1)))
    |> list.try_fold(dict.new(), fn(labels, label_line) {
      let #(line_no, label) = label_line
      case is_valid_identifier(label), labels |> dict.get(label) {
        False, _ ->
          Error(CompileErrorInfo(line: line_no, error: InvalidIdentifier(label)))
        True, Ok(prev_line_no) ->
          Error(CompileErrorInfo(
            line: line_no,
            error: DuplicateLabel(prev_line_no),
          ))
        True, _ -> Ok(labels |> dict.insert(label, line_no))
      }
    })

  use labels <- result.try(labels_result)

  let instruction_lines =
    stripped_lines
    |> list.filter(fn(line) { !line_is_label(line) })
    |> list.map(parse_line)
    |> result.all

  use instruction_lines <- result.try(instruction_lines)
  let sm = build_source_map(instruction_lines)

  let resolved_labels =
    labels
    |> dict.to_list
    |> list.try_map(fn(entry) {
      let #(label, address) = entry
      case resolve_address(sm, address, max_lines) {
        Ok(resolved) -> Ok(#(label, resolved))
        Error(_) ->
          Error(CompileErrorInfo(
            line: address,
            error: LabelWithoutInstruction(label),
          ))
      }
    })
    |> result.map(dict.from_list)

  use resolved_labels <- result.try(resolved_labels)

  instruction_lines
  |> process_replacements(resolved_labels)
  |> result.map(to_program)
}

fn process_replacements(
  lines: List(#(Int, CompileInstruction)),
  labels: dict.Dict(String, Int),
) -> Result(List(#(Int, Instruction)), CompileErrorInfo) {
  lines
  |> list.try_map(fn(line) {
    case line.1 {
      DirectInstruction(instruction) -> Ok(instruction)
      NamedJump(label) -> {
        case labels |> dict.get(label) {
          Error(_) -> Error(UnknownLabel(label))
          Ok(program_line) -> Ok(instruction.Jmp(program_line))
        }
      }
    }
    |> result.map(fn(inst) { #(line.0, inst) })
    |> result.map_error(fn(err) { CompileErrorInfo(line: line.0, error: err) })
  })
}

fn resolve_address(
  sm: source_map.SourceMap,
  source_line_no: Int,
  max_lines: Int,
) -> Result(Int, Nil) {
  use <- bool.guard(source_line_no >= max_lines, Error(Nil))
  case sm |> source_map.get_program_line(source_line_no + 1) {
    Ok(resolved) -> Ok(resolved)
    Error(_) -> resolve_address(sm, source_line_no + 1, max_lines)
  }
}

fn line_is_label(line: #(Int, String)) -> Bool {
  string.starts_with(pair.second(line), ":")
}

fn is_valid_identifier(text: String) -> Bool {
  let assert Ok(r) = regex.from_string("[a-zA-Z_][a-zA-Z0-9_]*")
  r |> regex.check(text)
}

fn parse_line(
  line: #(Int, String),
) -> Result(#(Int, CompileInstruction), CompileErrorInfo) {
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

fn build_source_map(lines: List(#(Int, a))) -> source_map.SourceMap {
  let program_to_source =
    lines
    |> list.index_map(fn(source_line, program_idx) {
      let #(source_line_no, _) = source_line
      #(program_idx + 1, source_line_no)
    })
  source_map.from_program_to_source(program_to_source)
}

/// Convert list of linenumber / instruction pairs to a Program
/// including source map.
fn to_program(lines: List(#(Int, Instruction))) -> Program {
  let instructions = lines |> list.map(pair.second)
  let sm = build_source_map(lines)
  program.from_instructions_and_source_map(instructions, sm)
}

fn parse_instruction(line: String) -> Result(CompileInstruction, CompileError) {
  let #(cmd, args) =
    line |> string.split_once(" ") |> result.unwrap(#(line, ""))
  case cmd {
    "nop" ->
      args |> parse_none(instruction.Nop) |> result.map(DirectInstruction)
    "inc" -> args |> parse_reg(instruction.Inc) |> result.map(DirectInstruction)
    "dec" -> args |> parse_reg(instruction.Dec) |> result.map(DirectInstruction)
    "isz" -> args |> parse_reg(instruction.Isz) |> result.map(DirectInstruction)
    "jmp" ->
      case is_valid_identifier(args) {
        True -> Ok(NamedJump(args))
        False ->
          args |> parse_addr(instruction.Jmp) |> result.map(DirectInstruction)
      }
    "stp" ->
      args |> parse_none(instruction.Stp) |> result.map(DirectInstruction)
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
    DuplicateLabel(previous_line) ->
      "DuplicateLabel, previous definition at line "
      <> int.to_string(previous_line)
    InvalidIdentifier(got) -> "InvalidIdentifier, got '" <> got <> "'"
    UnknownLabel(got) -> "UnknownLabel, got '" <> got <> "'"
    LabelWithoutInstruction(got) ->
      "LabelWithoutInstruction, got '" <> got <> "'"
  }
}
