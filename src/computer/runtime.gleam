import computer/instruction.{type Instruction}
import computer/program.{type Program}
import computer/registers.{type Registers}
import gleam/int

pub opaque type Runtime {
  Runtime(
    program: Program,
    initial_registers: Registers,
    registers: Registers,
    pc: ProgramCounter,
  )
}

pub type ProgramCounter {
  // Waiting at the first instruction, just after reset
  Reset(at: Int)
  /// Hit the iteration limit while executing a run, now paused at the start of the given instruction
  Running(at: Int)
  /// Paused at (the start of) an instruction, due to a step, breakpoint or iteration limit
  Paused(at: Int)
  /// Halted by the STP instruction at the given address
  Stopped(at: Int)
  /// Crashed at given address with given error
  Crashed(at: Int, error: RuntimeError)
}

pub type RuntimeError {
  AlreadyStopped
  UnexpectedEndOfProgram
  InvalidAddress(addr: Int)
  InvalidRegister(reg: Int)
}

pub fn new(program: Program, registers: Registers) -> Runtime {
  Runtime(program, registers, registers, pc: Reset(1))
}

pub fn reset(rt: Runtime) -> Runtime {
  rt |> set_registers(rt.initial_registers) |> set_pc(Reset(1))
}

pub fn set_addr(rt: Runtime, addr: Int) -> Result(Runtime, RuntimeError) {
  case program.is_valid_address(rt.program, addr) {
    True -> Ok(rt |> set_pc(Paused(addr)))
    False -> Error(InvalidAddress(addr))
  }
}

fn set_crashed(rt: Runtime, error: RuntimeError) -> Runtime {
  rt |> set_pc(Crashed(rt.pc.at, error))
}

fn set_pc(rt: Runtime, pc: ProgramCounter) -> Runtime {
  Runtime(..rt, pc: pc)
}

pub fn get_pc(rt: Runtime) -> ProgramCounter {
  rt.pc
}

pub fn get_registers(rt: Runtime) -> Registers {
  rt.registers
}

pub fn set_registers(rt: Runtime, regs: Registers) -> Runtime {
  case rt.pc {
    Reset(_) -> Runtime(..rt, registers: regs, initial_registers: regs)
    _ -> Runtime(..rt, registers: regs)
  }
}

pub fn get_program(rt: Runtime) -> Program {
  rt.program
}

pub fn set_program(rt: Runtime, program: Program) -> Runtime {
  Runtime(..rt, program: program)
}

pub fn is_runnable(rt: Runtime) -> Bool {
  case rt.pc {
    Reset(_) | Running(_) | Paused(_) -> True
    Stopped(_) | Crashed(..) -> False
  }
}

pub fn run(rt: Runtime, max_iterations: Int) -> Runtime {
  case max_iterations > 0 {
    True -> {
      let rt = do_step(rt)
      case rt |> get_pc {
        Running(_) -> run(rt, max_iterations - 1)
        _ -> rt
      }
    }
    False -> rt
  }
}

pub fn pause(rt: Runtime) -> Runtime {
  case rt |> get_pc {
    Running(at) -> rt |> set_pc(Paused(at))
    _ -> rt
  }
}

pub fn step(rt: Runtime) -> Runtime {
  let rt = do_step(rt)
  case rt |> get_pc {
    Running(at) -> rt |> set_pc(Paused(at))
    _ -> rt
  }
}

/// Perform one step in the run sequence, leaving the program
/// in either Running or a Stopped/Crashed state.
fn do_step(rt: Runtime) -> Runtime {
  case rt.pc {
    Reset(at) | Running(at) | Paused(at) ->
      case rt.program |> program.read(at) {
        Ok(instruction) -> exec(rt, instruction)
        _ -> rt |> set_crashed(InvalidAddress(at))
      }
    Stopped(_) -> rt |> set_crashed(AlreadyStopped)
    Crashed(..) -> rt
  }
}

type NextAddress {
  JumpRel(distance: Int)
  JumpAbs(addr: Int)
}

fn exec(rt: Runtime, instruction: Instruction) -> Runtime {
  case instruction {
    instruction.Inc(reg) ->
      case rt.registers |> registers.update(reg, int.add(_, 1)) {
        Ok(regs) -> Runtime(..rt, registers: regs) |> next(JumpRel(1))
        _ -> rt |> set_crashed(InvalidRegister(reg))
      }
    instruction.Dec(reg) ->
      case rt.registers |> registers.update(reg, int.subtract(_, 1)) {
        Ok(regs) -> Runtime(..rt, registers: regs) |> next(JumpRel(1))
        _ -> rt |> set_crashed(InvalidRegister(reg))
      }
    instruction.Isz(reg) ->
      case rt.registers |> registers.read(reg) {
        Ok(value) if value == 0 -> rt |> next(JumpRel(2))
        Ok(_) -> rt |> next(JumpRel(1))
        _ -> rt |> set_crashed(InvalidRegister(reg))
      }
    instruction.Jmp(addr) -> rt |> next(JumpAbs(addr))
    instruction.Stp -> rt |> set_pc(Stopped(rt.pc.at))
    instruction.Nop -> rt |> next(JumpRel(1))
  }
}

fn next(rt: Runtime, jump: NextAddress) -> Runtime {
  let target = case jump {
    JumpRel(distance) -> rt.pc.at + distance
    JumpAbs(addr) -> addr
  }
  case program.is_valid_address(rt.program, target) {
    True -> rt |> set_pc(Running(target))
    False -> rt |> set_crashed(InvalidAddress(target))
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
