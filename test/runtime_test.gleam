import computer/instruction
import computer/program
import computer/registers
import computer/runtime.{type Runtime}
import gleeunit/should

fn build_example() -> Runtime {
  let program =
    program.from_instructions([
      instruction.Jmp(4),
      instruction.Inc(1),
      instruction.Dec(2),
      instruction.Isz(2),
      instruction.Jmp(2),
      instruction.Stp,
    ])
  let regs = registers.from_list([3, 4])
  runtime.new(program, regs)
}

pub fn runtime_example_step1_test() {
  build_example()
  |> runtime.step()
  |> runtime.get_pc
  |> should.equal(runtime.Paused(4))
}

pub fn runtime_example_step3_test() {
  build_example()
  |> runtime.step()
  |> runtime.step()
  |> runtime.step()
  |> runtime.get_pc
  |> should.equal(runtime.Paused(2))
}

pub fn runtime_example_run_test() {
  build_example()
  |> runtime.run(100)
  |> runtime.get_registers
  |> registers.to_list
  |> should.equal([7, 0])
}

pub fn runtime_limits_iterations_test() {
  let rt =
    build_example()
    |> runtime.run(5)

  rt
  |> runtime.get_pc
  |> should.equal(runtime.Running(4))

  rt
  |> runtime.get_registers
  |> registers.to_list
  |> should.equal([4, 3])

  rt
  |> runtime.run(100)
  |> runtime.get_registers
  |> registers.to_list
  |> should.equal([7, 0])
}
