import computer/compiler
import computer/program
import computer/registers
import computer/runtime
import computer/source_map
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/queue
import gleam/result
import lustre
import lustre/attribute
import lustre/effect.{type Effect}
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
  let app = lustre.application(model.init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", 0)

  Nil
}

// UPDATE ----------------------------------------------------------------------

fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    update.AutoRun ->
      case model.rt |> runtime.get_pc {
        runtime.Running(_) -> do_run(model)
        _ -> #(model, effect.none())
      }

    update.Run -> do_run(model)

    update.Pause ->
      case model.rt |> runtime.get_pc {
        runtime.Running(_) -> #(
          Model(
            ..model,
            rt: model.rt |> runtime.pause,
            history: model.history |> queue.push_front(model.rt),
          ),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }

    update.Step -> #(
      Model(
        ..model,
        rt: model.rt |> runtime.step,
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )

    update.Reset -> #(
      Model(
        ..model,
        rt: model.rt |> runtime.reset(),
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )

    update.Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) -> #(
          Model(..model, rt: head, history: rest),
          effect.none(),
        )
        _ -> #(model, effect.none())
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
          #(
            Model(
              ..model,
              rt: rt,
              history: model.history |> queue.push_front(model.rt),
            ),
            effect.none(),
          )
        }
        Error(errors) -> #(
          Model(..model, compile_errors: [errors]),
          effect.none(),
        )
      }
    }

    update.RegisterLinesChanged(lines) -> {
      case lines |> list.try_map(int.parse) |> result.map(registers.from_list) {
        Ok(regs) -> #(
          Model(
            ..model,
            rt: model.rt |> runtime.set_registers(regs),
            history: model.history |> queue.push_front(model.rt),
            register_lines: None,
          ),
          effect.none(),
        )
        Error(_) -> #(
          Model(..model, register_lines: Some(lines)),
          effect.none(),
        )
      }
    }
  }
}

fn do_run(model: Model) -> #(Model, Effect(Msg)) {
  let rt = model.rt |> runtime.run(100)
  case rt |> runtime.get_pc {
    // Iterations exceeded, keep running on next tick
    runtime.Running(_) -> #(Model(..model, rt: rt), next_tick(update.AutoRun))
    // Done running & add to history
    _ -> #(
      Model(
        ..model,
        rt: rt,
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )
  }
}

fn next_tick(msg: a) -> Effect(a) {
  effect.from(fn(dispatch) { set_timeout(0, fn() { dispatch(msg) }) })
}

@external(javascript, "./ffi.mjs", "set_timeout")
fn set_timeout(_ms: Int, _cb: fn() -> a) -> Nil {
  panic as "not implemented on this target"
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
    case pc {
      runtime.Running(_) ->
        ui.button([event.on_click(update.Pause)], [icon.pause([])])
      _ ->
        ui.button(
          [event.on_click(update.Run), attribute.disabled(step_run_disabled)],
          [icon.play([])],
        )
    },
    text(fmt_pc(model.rt)),
  ])
}

fn fmt_pc(rt: runtime.Runtime) -> String {
  let program_at = { rt |> runtime.get_pc }.at
  let source_at =
    rt
    |> runtime.get_program
    |> program.get_source_map
    |> source_map.get_source_line(program_at)

  let line_text = case source_at {
    Ok(source_at) ->
      "at "
      <> { program_at |> int.to_string }
      <> " (line "
      <> { source_at |> int.to_string }
      <> ")"
    Error(_) -> "at " <> { program_at |> int.to_string }
  }
  case rt |> runtime.get_pc {
    runtime.Reset(_) -> "Ready"
    runtime.Running(_) -> "Running"
    runtime.Paused(_) -> "Paused " <> line_text
    runtime.Stopped(_) -> "Stopped " <> line_text
    runtime.Crashed(_, err) ->
      "Crashed at " <> line_text <> ": " <> runtime.runtime_error_to_string(err)
  }
}
