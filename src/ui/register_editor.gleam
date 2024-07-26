import computer/registers
import computer/runtime
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import lustre/attribute
import lustre/element.{type Element}
import ui/codemirror
import ui/model.{type Model, Model}
import ui/update.{type Msg}

pub fn view(model: Model) -> Element(Msg) {
  let styles = [#("width", "100%"), #("max-width", "12rem")]
  let #(lines, diagnostics) = case model.register_lines {
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
    codemirror.editor([attribute.style(styles)], lines, diagnostics)
    |> element.map(fn(msg) {
      case msg {
        codemirror.ContentChanged(lines) -> update.RegisterLinesChanged(lines)
        _ -> update.Nop
      }
    }),
  ])
}

fn get_errors(lines: List(String)) -> List(codemirror.Diagnostic) {
  lines
  |> list.map(int.parse)
  |> list.index_map(fn(res, idx) { #(idx + 1, res) })
  |> list.filter_map(fn(res) {
    case res {
      #(_, Ok(_)) -> Error(Nil)
      #(line_no, Error(_)) ->
        Ok(codemirror.LineDiagnostic(
          line: line_no,
          message: "Integer expected",
          severity: codemirror.ErrorSeverity,
        ))
    }
  })
}
