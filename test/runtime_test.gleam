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
  let regs =
    registers.new(2)
    |> registers.write(1, 3)
    |> should.be_ok
    |> registers.write(2, 4)
    |> should.be_ok
  let assert Ok(rt) = runtime.new(program, regs)
  rt
}

pub fn runtime_example_step1_test() {
  build_example()
  |> runtime.step()
  |> should.be_ok
  |> runtime.get_pc
  |> should.equal(runtime.Paused(4))
}

pub fn runtime_example_step3_test() {
  build_example()
  |> runtime.step()
  |> should.be_ok
  |> runtime.step()
  |> should.be_ok
  |> runtime.step()
  |> should.be_ok
  |> runtime.get_pc
  |> should.equal(runtime.Paused(2))
}

pub fn runtime_example_run_test() {
  build_example()
  |> runtime.run()
  |> should.be_ok
  |> runtime.get_registers
  |> registers.to_list
  |> should.equal([7, 0])
}
