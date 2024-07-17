import computer/instruction.{type Instruction}
import computer/program.{type Program}
import computer/registers.{type Registers}
import gleam/bool
import gleam/int

pub opaque type Runtime {
  Runtime(program: Program, registers: Registers, pc: ProgramCounter)
}

pub type ProgramCounter {
  /// Paused at (the start of) an instruction
  Paused(at: Int)
  /// Halted by the instruction at the given address
  Stopped(at: Int)
}

pub type RuntimeError {
  AlreadyStopped
  UnexpectedEndOfProgram
  InvalidAddress(addr: Int)
  InvalidRegister(reg: Int)
}

pub fn new(
  program: Program,
  registers: Registers,
) -> Result(Runtime, RuntimeError) {
  Runtime(program, registers, pc: Paused(0)) |> set_pc(1)
}

pub fn set_pc(rt: Runtime, addr: Int) -> Result(Runtime, RuntimeError) {
  case program.is_valid_address(rt.program, addr) {
    True -> Ok(Runtime(..rt, pc: Paused(addr)))
    False -> Error(InvalidAddress(addr))
  }
}

pub fn get_pc(rt: Runtime) -> ProgramCounter {
  rt.pc
}

pub fn get_registers(rt: Runtime) -> Registers {
  rt.registers
}

pub fn set_registers(rt: Runtime, regs: Registers) -> Runtime {
  Runtime(..rt, registers: regs)
}

pub fn get_program(rt: Runtime) -> Program {
  rt.program
}

pub fn run(rt: Runtime, max_iterations: Int) -> Result(Runtime, RuntimeError) {
  use <- bool.guard(max_iterations <= 0, Ok(rt))
  case step(rt) {
    Ok(rt) ->
      case rt.pc {
        Stopped(_) -> Ok(rt)
        _ -> run(rt, max_iterations - 1)
      }
    err -> err
  }
}

pub fn step(rt: Runtime) -> Result(Runtime, RuntimeError) {
  case rt.pc {
    Stopped(_) -> Error(AlreadyStopped)
    Paused(at) ->
      case rt.program |> program.read(at) {
        Ok(instruction) -> exec(rt, instruction)
        _ -> Error(InvalidAddress(at))
      }
  }
}

type NextAddress {
  JumpRel(distance: Int)
  JumpAbs(addr: Int)
}

fn exec(rt: Runtime, instruction: Instruction) -> Result(Runtime, RuntimeError) {
  case instruction {
    instruction.Inc(reg) ->
      case rt.registers |> registers.update(reg, int.add(_, 1)) {
        Ok(regs) -> Runtime(..rt, registers: regs) |> next(JumpRel(1))
        _ -> Error(InvalidRegister(reg))
      }
    instruction.Dec(reg) ->
      case rt.registers |> registers.update(reg, int.subtract(_, 1)) {
        Ok(regs) -> Runtime(..rt, registers: regs) |> next(JumpRel(1))
        _ -> Error(InvalidRegister(reg))
      }
    instruction.Isz(reg) ->
      case rt.registers |> registers.read(reg) {
        Ok(value) if value == 0 -> rt |> next(JumpRel(2))
        Ok(_) -> rt |> next(JumpRel(1))
        _ -> Error(InvalidRegister(reg))
      }
    instruction.Jmp(addr) -> rt |> next(JumpAbs(addr))
    instruction.Stp -> Ok(Runtime(..rt, pc: Stopped(rt.pc.at)))
    instruction.Nop -> rt |> next(JumpRel(1))
  }
}

fn next(rt: Runtime, jump: NextAddress) -> Result(Runtime, RuntimeError) {
  let assert Paused(at) = rt.pc
  case jump {
    JumpRel(distance) -> rt |> set_pc(at + distance)
    JumpAbs(addr) -> rt |> set_pc(addr)
  }
}

pub fn runtime_error_to_string(error: RuntimeError) -> String {
  case error {
    AlreadyStopped -> "AlreadyStopped"
    UnexpectedEndOfProgram -> "UnexpectedEndOfProgram"
    InvalidAddress(addr) -> "InvalidAddress: " <> int.to_string(addr)
    InvalidRegister(reg) -> "InvalidRegister: " <> int.to_string(reg)
  }
}
