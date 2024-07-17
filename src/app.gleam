import computer/compiler
import computer/registers
import computer/runtime
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/queue
import gleam/result
import lustre
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/icon
import ui/model.{type Model, Model}
import ui/program_editor
import ui/register_editor
import ui/update.{type Msg}

// MAIN ------------------------------------------------------------------------

pub fn main() {
  let app = lustre.simple(model.init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", 0)

  Nil
}

// UPDATE ----------------------------------------------------------------------

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    update.Run ->
      case model.rt |> runtime.run(100) {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    update.Step ->
      case model.rt |> runtime.step {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    update.Reset ->
      case runtime.new(model.rt |> runtime.get_program, model.initial_regs) {
        Ok(rt) ->
          Model(
            ..model,
            rt: rt,
            error: None,
            history: model.history |> queue.push_front(model.rt),
          )
        Error(err) -> Model(..model, error: Some(err))
      }
    update.Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) ->
          Model(..model, error: None, rt: head, history: rest)
        _ -> model
      }
    update.LinesChanged(lines) -> {
      let model = Model(..model, lines: lines, compile_errors: [])
      case compiler.compile(lines) {
        Ok(program) ->
          case runtime.new(program, model.initial_regs) {
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
    update.RegisterLinesChanged(lines) -> {
      case lines |> list.try_map(int.parse) |> result.map(registers.from_list) {
        Ok(regs) ->
          Model(
            ..model,
            rt: model.rt |> runtime.set_registers(regs),
            history: model.history |> queue.push_front(model.rt),
            initial_regs: case model.rt |> runtime.get_pc {
              runtime.Paused(1) -> regs
              _ -> model.initial_regs
            },
            register_lines: None,
          )
        Error(_) -> Model(..model, register_lines: Some(lines))
      }
    }
  }
}

// VIEW ------------------------------------------------------------------------

fn view(model: Model) -> Element(Msg) {
  ui.box([], [
    ui.stack([], [html.h3([], [text("Registers")]), register_editor.view(model)]),
    ui.stack([], [html.h3([], [text("Control")]), control_view(model)]),
    program_editor.view(model),
  ])
}

fn control_view(model: Model) {
  ui.group([], [
    ui.button(
      [
        event.on_click(update.Undo),
        // TODO disabled doesn't work...
        attribute.disabled(model.history |> queue.is_empty),
      ],
      [icon.reset([])],
    ),
    ui.button([event.on_click(update.Reset)], [icon.reload([])]),
    ui.button([event.on_click(update.Step)], [icon.resume([])]),
    ui.button([event.on_click(update.Run)], [icon.play([])]),
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
