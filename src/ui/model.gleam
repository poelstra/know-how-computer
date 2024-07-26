import computer/compiler
import computer/registers
import computer/runtime
import gleam/option.{None}
import gleam/queue
import gleam/string
import lustre/effect.{type Effect}

pub type Model {
  Model(
    lines: List(String),
    rt: runtime.Runtime,
    history: queue.Queue(runtime.Runtime),
    compile_errors: List(compiler.CompileErrorInfo),
    register_lines: option.Option(List(String)),
    breakpoints: List(Int),
    selected_line: Int,
  )
}

pub fn init(_flags) -> #(Model, Effect(a)) {
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
  let rt = runtime.new(program, regs)
  #(
    Model(
      lines: lines,
      rt: rt,
      history: queue.new(),
      compile_errors: [],
      register_lines: None,
      breakpoints: [],
      selected_line: 1,
    ),
    effect.none(),
  )
}
