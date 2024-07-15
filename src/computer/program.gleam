import computer/instruction.{type Instruction}
import gleam/dict.{type Dict}
import gleam/list

pub opaque type Program {
  Program(instructions: Dict(Int, Instruction))
}

pub fn from_instructions(instructions: List(Instruction)) -> Program {
  instructions
  |> list.index_map(fn(inst, line) { #(line + 1, inst) })
  |> dict.from_list
  |> Program
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
