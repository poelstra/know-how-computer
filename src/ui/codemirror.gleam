import gleam/dynamic
import gleam/json
import gleam/list
import gleam/result
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/event

@external(javascript, "../codemirror_ffi.mjs", "install")
pub fn install() -> Nil

pub type CodeMirrorMessage {
  ContentChanged(lines: List(String))
  BreakpointsChanged(breakpoints: List(Int))
  SelectedLineChanged(line: Int)
}

pub type DiagnosticSeverity {
  ErrorSeverity
  HintSeverity
  InfoSeverity
  WarningSeverity
}

pub type Diagnostic {
  RangeDiagnostic(
    message: String,
    severity: DiagnosticSeverity,
    from: Int,
    to: Int,
  )
  LineDiagnostic(message: String, severity: DiagnosticSeverity, line: Int)
}

fn get_line_range(lines: List(String), line_no: Int) -> #(Int, Int) {
  do_get_line_range(lines |> list.take(line_no), 0)
}

fn do_get_line_range(lines: List(String), acc: Int) -> #(Int, Int) {
  case lines {
    [] -> #(0, 0)
    [head] -> #(acc, acc + string.length(head))
    [head, ..rest] -> do_get_line_range(rest, acc + string.length(head) + 1)
  }
}

fn diagnostics_to_json(
  diagnostics: List(Diagnostic),
  lines: List(String),
) -> json.Json {
  json.array(diagnostics, fn(diagnostic) {
    let #(from, to) = case diagnostic {
      RangeDiagnostic(from: from, to: to, ..) -> #(from, to)
      LineDiagnostic(line: line_no, ..) -> get_line_range(lines, line_no)
    }
    json.object([
      #("from", json.int(from)),
      #("to", json.int(to)),
      #("message", json.string(diagnostic.message)),
      #(
        "severity",
        json.string(case diagnostic.severity {
          ErrorSeverity -> "error"
          HintSeverity -> "hint"
          InfoSeverity -> "info"
          WarningSeverity -> "warning"
        }),
      ),
    ])
  })
}

pub fn editor(
  attributes: List(attribute.Attribute(CodeMirrorMessage)),
  lines: List(String),
  diagnostics: List(Diagnostic),
) -> Element(CodeMirrorMessage) {
  element.element(
    "code-mirror",
    [
      attribute.attribute("value", lines |> string.join("\n")),
      attribute.property("diagnostics", diagnostics_to_json(diagnostics, lines)),
      event.on("lines-changed", fn(event) {
        event
        |> dynamic.field("detail", dynamic.list(of: dynamic.string))
        |> result.map(ContentChanged)
      }),
      event.on("selected-line-changed", fn(event) {
        event
        |> dynamic.field("detail", dynamic.int)
        |> result.map(SelectedLineChanged)
      }),
      event.on("breakpoints-changed", fn(event) {
        event
        |> dynamic.field("detail", dynamic.list(of: dynamic.int))
        |> result.map(BreakpointsChanged)
      }),
      ..attributes
    ],
    [],
  )
}
