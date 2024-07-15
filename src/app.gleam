import computer/compiler
import computer/registers
import computer/runtime
import gleam/int
import gleam/list
import gleam/option
import gleam/queue
import lustre
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/icon
import ui/registers as ui_registers
import ui/table

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", 0)

  Nil
}

// MODEL -----------------------------------------------------------------------

type Model {
  Model(
    lines: List(String),
    rt: runtime.Runtime,
    error: option.Option(runtime.RuntimeError),
    history: queue.Queue(runtime.Runtime),
  )
}

fn init(_flags) -> Model {
  let lines = ["jmp 4", "inc 1", "dec 2", "isz 2", "jmp 2", "stp"]
  let assert Ok(program) = compiler.compile(lines)
  let regs = registers.new(4)
  let assert Ok(regs) = regs |> registers.write(1, 3)
  let assert Ok(regs) = regs |> registers.write(2, 4)
  let assert Ok(rt) = runtime.new(program, regs)
  Model(lines, rt, option.None, queue.new())
}

// UPDATE ----------------------------------------------------------------------

pub opaque type Msg {
  Undo
  Reset
  Step
  Run
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Run ->
      case model.rt |> runtime.run {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: option.Some(err))
      }
    Step ->
      case model.rt |> runtime.step {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: option.Some(err))
      }
    Reset ->
      case model.rt |> runtime.set_pc(1) {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            error: option.None,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: option.Some(err))
      }
    Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) ->
          Model(..model, error: option.None, rt: head, history: rest)
        _ -> model
      }
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  ui.box([], [
    ui.stack([], [
      html.h3([], [text("Registers")]),
      ui_registers.view(model.rt |> runtime.get_registers),
    ]),
    ui.stack([], [html.h3([], [text("Control")]), control_view(model)]),
    ui.stack([], [html.h3([], [text("Program")]), program_view(model)]),
  ])
}

fn control_view(model: Model) {
  ui.group([], [
    ui.button(
      [
        event.on_click(Undo),
        // TODO disabled doesn't work...
        attribute.disabled(model.history |> queue.is_empty),
      ],
      [icon.reset([])],
    ),
    ui.button([event.on_click(Reset)], [icon.reload([])]),
    ui.button([event.on_click(Step)], [icon.resume([])]),
    ui.button([event.on_click(Run)], [icon.play([])]),
    case model.rt |> runtime.get_pc {
      runtime.Paused(at) -> text("Paused at " <> { at |> int.to_string })
      runtime.Stopped(at) -> text("Stopped at " <> { at |> int.to_string })
    },
    html.br([]),
    case model.error {
      option.None -> element.none()
      option.Some(err) ->
        text("Error: " <> runtime.runtime_error_to_string(err))
    },
  ])
}

fn program_view(model: Model) -> Element(a) {
  model.lines
  |> list.index_map(fn(line, idx) {
    let pc = model.rt |> runtime.get_pc
    let indicator = case pc.at == idx + 1, pc {
      False, _ -> ""
      True, runtime.Paused(_) -> ">"
      True, runtime.Stopped(_) -> "*"
    }
    [indicator, int.to_string(idx + 1), line]
  })
  |> table.table
}
