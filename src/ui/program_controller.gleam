import computer/program
import computer/runtime
import computer/source_map
import gleam/int
import gleam/queue
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/event
import lustre/ui
import lustre/ui/icon
import ui/model.{type Model, Model}
import ui/msg.{type Msg}

pub fn view(model: Model) -> Element(Msg) {
  let pc = model.rt |> runtime.get_pc
  let reset_disabled = case pc {
    runtime.Reset(_) -> True
    _ -> False
  }
  let step_run_disabled = case pc {
    runtime.Stopped(_) | runtime.Crashed(..) -> True
    _ -> False
  }
  element.fragment([
    ui.group([], [
      ui.button(
        [
          event.on_click(msg.Undo),
          attribute.disabled(model.history |> queue.is_empty),
          attribute.attribute("title", "Undo program step / register change"),
        ],
        [icon.counter_clockwise_clock([])],
      ),
      ui.button(
        [
          event.on_click(msg.Reset),
          attribute.disabled(reset_disabled),
          attribute.attribute("title", "Reset program and registers"),
        ],
        [icon.reload([])],
      ),
      ui.button(
        [
          event.on_click(msg.SetActiveLineToSelection),
          attribute.attribute("title", "Set program counter at cursor"),
        ],
        [icon.pin_right([])],
      ),
      ui.button(
        [
          event.on_click(msg.Step),
          attribute.disabled(step_run_disabled),
          attribute.attribute("title", "Step"),
        ],
        [icon.resume([])],
      ),
      case pc {
        runtime.Running(_) ->
          ui.button([event.on_click(msg.Pause)], [icon.pause([])])
        _ ->
          ui.button(
            [
              event.on_click(msg.Run),
              attribute.disabled(step_run_disabled),
              attribute.attribute("title", "Run"),
            ],
            [icon.play([])],
          )
      },
    ]),
    html.span([attribute.class("program-state")], [text(fmt_pc(model.rt))]),
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
