import gleam/dict.{type Dict}
import gleam/list
import gleam/pair

pub opaque type SourceMap {
  SourceMap(
    program_to_source: Dict(Int, Int),
    source_to_program: Dict(Int, Int),
  )
}

pub fn from_program_to_source(program_to_source: List(#(Int, Int))) -> SourceMap {
  let p2s = program_to_source |> dict.from_list
  let s2p = program_to_source |> list.map(pair.swap) |> dict.from_list
  SourceMap(p2s, s2p)
}

pub fn get_source_line(sm: SourceMap, program_line: Int) -> Result(Int, Nil) {
  sm.program_to_source |> dict.get(program_line)
}

pub fn get_program_line(sm: SourceMap, source_line: Int) -> Result(Int, Nil) {
  sm.source_to_program |> dict.get(source_line)
}
