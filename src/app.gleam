import computer/compiler
import computer/registers
import computer/runtime
import gleam/dynamic
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{None, Some}
import gleam/queue
import gleam/result
import gleam/string
import lustre
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/icon
import ui/registers as ui_registers

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
    initial_regs: List(Int),
    rt: runtime.Runtime,
    error: option.Option(runtime.RuntimeError),
    history: queue.Queue(runtime.Runtime),
    compile_errors: List(compiler.CompileErrorInfo),
  )
}

fn init(_flags) -> Model {
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
    initial_regs: initial_regs,
    compile_errors: [],
  )
}

// UPDATE ----------------------------------------------------------------------

pub opaque type Msg {
  Undo
  Reset
  Step
  Run
  LinesChanged(lines: List(String))
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    Run ->
      case model.rt |> runtime.run(100) {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    Step ->
      case model.rt |> runtime.step {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    Reset ->
      case
        runtime.new(
          model.rt |> runtime.get_program,
          model.initial_regs |> registers.from_list,
        )
      {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            error: None,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) ->
          Model(..model, error: None, rt: head, history: rest)
        _ -> model
      }
    LinesChanged(lines) -> {
      let model = Model(..model, lines: lines, compile_errors: [])
      case compiler.compile(lines) {
        Ok(program) ->
          case runtime.new(program, model.initial_regs |> registers.from_list) {
            Ok(rt) ->
              Model(
                ..model,
                rt: rt,
                error: None,
                history: model.history |> queue.push_front(model.rt),
              )
            Error(err) -> Model(..model, error: Some(err))
          }
        Error(errors) -> Model(..model, compile_errors: [errors])
      }
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
    program_editor(model),
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
      None -> element.none()
      Some(err) -> text("Error: " <> runtime.runtime_error_to_string(err))
    },
  ])
}

fn program_editor(model: Model) -> Element(Msg) {
  let styles = [#("width", "100%")]
  let error_info = case model.compile_errors {
    [] -> None
    [error_info, ..] -> Some(error_info)
  }
  element.fragment([
    html.text(case error_info {
      None -> "Compilation succeeded"
      Some(error_info) ->
        "Line "
        <> int.to_string(error_info.line)
        <> ": "
        <> compiler.compile_error_to_string(error_info.error)
    }),
    html.ol(
      [
        attribute.id("editor"),
        attribute.style(styles),
        attribute.attribute("contenteditable", "true"),
        event.on("input", fn(event) {
          use target <- result.try(dynamic.field("target", dynamic.dynamic)(
            event,
          ))
          use text <- result.try(dynamic.field("innerText", dynamic.string)(
            target,
          ))
          Ok(LinesChanged(text |> string.split("\n")))
        }),
      ],
      model.lines
        |> list.index_map(fn(line, idx) {
          html.li(line_attr(model, idx + 1), [text(line)])
        }),
    ),
  ])
}

fn line_attr(model: Model, line_no: Int) -> List(attribute.Attribute(a)) {
  [
    case model.compile_errors |> list.any(fn(info) { info.line == line_no }) {
      True -> attribute.class("error")
      False -> attribute.none()
    },
    case model.rt |> runtime.get_pc {
      runtime.Paused(at) if at == line_no -> attribute.class("paused")
      runtime.Stopped(at) if at == line_no -> attribute.class("stopped")
      _ -> attribute.none()
    },
  ]
}
