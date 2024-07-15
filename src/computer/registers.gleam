import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/pair

pub opaque type Registers {
  Registers(regs: Dict(Int, Int))
}

pub fn new(size: Int) -> Registers {
  list.range(1, size)
  |> list.map(fn(idx) { #(idx, 0) })
  |> dict.from_list
  |> Registers
}

pub fn from_list(values: List(Int)) -> Registers {
  values
  |> list.index_map(fn(value, idx) { #(idx + 1, value) })
  |> dict.from_list
  |> Registers
}

pub fn write(regs: Registers, addr: Int, value: Int) -> Result(Registers, Nil) {
  case regs.regs |> dict.has_key(addr) {
    True -> Ok(regs.regs |> dict.insert(addr, value) |> Registers)
    False -> Error(Nil)
  }
}

pub fn read(regs: Registers, reg: Int) -> Result(Int, Nil) {
  regs.regs |> dict.get(reg)
}

pub fn to_list(regs: Registers) -> List(Int) {
  regs.regs
  |> dict.to_list
  |> list.sort(fn(a, b) { int.compare(a.0, b.0) })
  |> list.map(pair.second)
}

pub fn update(
  regs: Registers,
  reg: Int,
  updater: fn(Int) -> Int,
) -> Result(Registers, Nil) {
  case regs.regs |> dict.get(reg) {
    Ok(value) -> Ok(regs.regs |> dict.insert(reg, updater(value)) |> Registers)
    _ -> Error(Nil)
  }
}
