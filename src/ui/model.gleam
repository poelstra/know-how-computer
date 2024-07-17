import computer/compiler
import computer/registers
import computer/runtime
import gleam/option.{None}
import gleam/queue
import gleam/string

pub type Model {
  Model(
    lines: List(String),
    initial_regs: registers.Registers,
    rt: runtime.Runtime,
    error: option.Option(runtime.RuntimeError),
    history: queue.Queue(runtime.Runtime),
    compile_errors: List(compiler.CompileErrorInfo),
    register_lines: option.Option(List(String)),
  )
}

pub fn init(_flags) -> Model {
  let initial_regs = [3, 4, 0, 0]
  let source =
    "
jmp 4
inc 1
dec 2
isz 2
jmp 2
stp
"
  let lines = source |> string.trim |> string.split("\n")
  let assert Ok(program) = compiler.compile(lines)
  let regs = registers.from_list(initial_regs)
  let assert Ok(rt) = runtime.new(program, regs)
  Model(
    lines: lines,
    rt: rt,
    error: None,
    history: queue.new(),
    initial_regs: regs,
    compile_errors: [],
    register_lines: None,
  )
}
