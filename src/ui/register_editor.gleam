import computer/registers
import computer/runtime
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
  let styles = [#("width", "100%"), #("max-width", "20rem")]
  let #(lines, errors) = case model.register_lines {
    Some(lines) -> #(lines, get_errors(lines))
    None -> {
      let lines =
        model.rt
        |> runtime.get_registers
        |> registers.to_list
        |> list.map(int.to_string)
      #(lines, [])
    }
  }
  element.fragment([
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
          Ok(update.RegisterLinesChanged(text |> string.split("\n")))
        }),
      ],
      lines
        |> list.index_map(fn(line, idx) {
          html.li(line_attr(errors, idx + 1), [text(line)])
        }),
    ),
  ])
}

fn get_errors(lines: List(String)) -> List(Int) {
  lines
  |> list.map(int.parse)
  |> list.index_map(fn(res, idx) { #(idx + 1, res) })
  |> list.filter_map(fn(res) {
    case res {
      #(_, Ok(_)) -> Error(Nil)
      #(idx, Error(_)) -> Ok(idx)
    }
  })
}

fn line_attr(errors: List(Int), line_no: Int) -> List(attribute.Attribute(a)) {
  [
    case errors |> list.contains(line_no) {
      True -> attribute.class("error")
      False -> attribute.none()
    },
  ]
}
