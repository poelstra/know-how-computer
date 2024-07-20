import computer/compiler
import computer/program
import computer/runtime
import computer/source_map
import gleam/dynamic
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/event
import ui/model.{type Model, Model}
import ui/update.{type Msg}

pub fn view(model: Model) -> Element(Msg) {
  let styles = [#("width", "100%")]
  let error_info = case model.compile_errors {
    [] -> None
    [error_info, ..] -> Some(error_info)
  }
  let program_at = runtime.get_pc(model.rt).at
  let source_at =
    model.rt
    |> runtime.get_program
    |> program.get_source_map
    |> source_map.get_source_line(program_at)
    |> result.unwrap(0)
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
        attribute.class("editor"),
        attribute.style(styles),
        attribute.attribute("contenteditable", "true"),
        event.on("input", fn(event) {
          use target <- result.try(dynamic.field("target", dynamic.dynamic)(
            event,
          ))
          use text <- result.try(dynamic.field("innerText", dynamic.string)(
            target,
          ))
          Ok(update.ProgramLinesChanged(text |> string.split("\n")))
        }),
      ],
      model.lines
        |> list.index_map(fn(line, idx) {
          html.li(line_attr(model, idx + 1, source_at), [text(line)])
        }),
    ),
  ])
}

fn line_attr(
  model: Model,
  line_no: Int,
  current_line: Int,
) -> List(attribute.Attribute(a)) {
  [
    case model.compile_errors |> list.any(fn(info) { info.line == line_no }) {
      True -> attribute.class("error")
      False -> attribute.none()
    },
    case line_no == current_line {
      True ->
        case model.rt |> runtime.get_pc {
          runtime.Reset(_) -> attribute.class("paused")
          runtime.Paused(_) -> attribute.class("paused")
          runtime.Stopped(_) -> attribute.class("stopped")
          runtime.Crashed(_, _) -> attribute.class("crashed")
        }
      False -> attribute.none()
    },
  ]
}
