import computer/instruction.{type Instruction}
import computer/source_map.{type SourceMap}
import gleam/dict.{type Dict}
import gleam/list

pub opaque type Program {
  Program(instructions: Dict(Int, Instruction), source_map: SourceMap)
}

pub fn from_instructions(instructions: List(Instruction)) -> Program {
  let sm =
    source_map.from_program_to_source(
      instructions |> list.index_map(fn(_, idx) { #(idx + 1, idx + 1) }),
    )
  from_instructions_and_source_map(instructions, sm)
}

pub fn from_instructions_and_source_map(
  instructions: List(Instruction),
  source_map: SourceMap,
) -> Program {
  let instructions =
    instructions
    |> list.index_map(fn(inst, line) { #(line + 1, inst) })
    |> dict.from_list
  Program(instructions, source_map)
}

pub fn get_source_map(program: Program) -> SourceMap {
  program.source_map
}

pub fn is_valid_address(program: Program, addr: Int) -> Bool {
  addr >= 1 && addr <= dict.size(program.instructions)
}

pub fn size(program: Program) -> Int {
  program.instructions |> dict.size
}

pub fn read(program: Program, addr: Int) -> Result(Instruction, Nil) {
  program.instructions |> dict.get(addr)
}
