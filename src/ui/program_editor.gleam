import computer/compiler
import computer/program
import computer/runtime
import computer/source_map
import gleam/json
import gleam/list
import gleam/option
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import ui/codemirror
import ui/model.{type Model, Model}
import ui/msg.{type Msg}

pub fn view(model: Model) -> Element(Msg) {
  let styles = [#("width", "100%"), #("max-width", "50rem")]
  // let error_info = case model.compile_errors {
  //   [] -> None
  //   [error_info, ..] -> Some(error_info)
  // }
  let diagnostics =
    model.compile_errors
    |> list.map(fn(error_info) {
      codemirror.LineDiagnostic(
        line: error_info.line,
        message: compiler.compile_error_to_string(error_info.error),
        severity: codemirror.ErrorSeverity,
      )
    })
  let program_at = runtime.get_pc(model.rt).at
  let active_source_line =
    model.rt
    |> runtime.get_program
    |> program.get_source_map
    |> source_map.get_source_line(program_at)
    |> option.from_result
  element.fragment([
    // html.div([], [
    //   html.text(case error_info {
    //     None -> "Compilation succeeded"
    //     Some(error_info) ->
    //       "Line "
    //       <> int.to_string(error_info.line)
    //       <> ": "
    //       <> compiler.compile_error_to_string(error_info.error)
    //   }),
    // ]),
    html.div([attribute.style(styles)], [
      codemirror.editor(
        [
          attribute.property(
            "activeProgramLine",
            json.nullable(active_source_line, of: json.int),
          ),
        ],
        model.lines,
        diagnostics,
      )
      |> element.map(fn(msg) {
        case msg {
          codemirror.ContentChanged(lines) -> msg.ProgramLinesChanged(lines)
          codemirror.BreakpointsChanged(bps) -> msg.BreakpointsChanged(bps)
          codemirror.SelectedLineChanged(line_no) ->
            msg.SelectedLineChanged(line_no)
        }
      }),
    ]),
  ])
}
