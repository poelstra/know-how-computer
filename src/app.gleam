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
      Model(
        ..model,
        rt: model.rt |> runtime.run(100),
        history: model.history |> queue.push_front(model.rt),
      )

    update.Step ->
      Model(
        ..model,
        rt: model.rt |> runtime.step,
        history: model.history |> queue.push_front(model.rt),
      )

    update.Reset ->
      Model(
        ..model,
        rt: model.rt |> runtime.reset(),
        history: model.history |> queue.push_front(model.rt),
      )

    update.Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) -> Model(..model, rt: head, history: rest)
        _ -> model
      }

    update.ProgramLinesChanged(lines) -> {
      let model = Model(..model, lines: lines, compile_errors: [])
      case compiler.compile(lines) {
        Ok(program) -> {
          let prev_pc = model.rt |> runtime.get_pc
          let rt_reset = model.rt |> runtime.set_program(program)
          let rt = case rt_reset |> runtime.set_addr(prev_pc.at) {
            Ok(rt) -> rt
            Error(_) -> rt_reset
          }
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          )
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
  let pc = model.rt |> runtime.get_pc
  let reset_disabled = case pc {
    runtime.Reset(_) -> True
    _ -> False
  }
  let step_run_disabled = case pc {
    runtime.Stopped(_) | runtime.Crashed(..) -> True
    _ -> False
  }
  ui.group([], [
    ui.button(
      [
        event.on_click(update.Undo),
        attribute.disabled(model.history |> queue.is_empty),
      ],
      [icon.reset([])],
    ),
    ui.button(
      [event.on_click(update.Reset), attribute.disabled(reset_disabled)],
      [icon.reload([])],
    ),
    ui.button(
      [event.on_click(update.Step), attribute.disabled(step_run_disabled)],
      [icon.resume([])],
    ),
    ui.button(
      [event.on_click(update.Run), attribute.disabled(step_run_disabled)],
      [icon.play([])],
    ),
    case pc {
      runtime.Reset(_) -> text("Ready")
      runtime.Paused(at) -> text("Paused at " <> { at |> int.to_string })
      runtime.Stopped(at) -> text("Stopped at " <> { at |> int.to_string })
      runtime.Crashed(at, err) ->
        text(
          "Crashed at "
          <> { at |> int.to_string }
          <> ": "
          <> runtime.runtime_error_to_string(err),
        )
    },
  ])
}
