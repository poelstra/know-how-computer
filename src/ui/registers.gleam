import computer/registers
import gleam/int
import gleam/list
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html

pub fn view(registers: registers.Registers) -> Element(a) {
  let border_styles = [#("border", "1px solid"), #("max-width", "20rem")]
  html.table([attribute.style(border_styles)], [
    // html.thead([], [
    //   html.tr([], [html.th([], [text("#")]), html.th([], [text("Value")])]),
    // ]),
    html.tbody(
      [attribute.style(border_styles)],
      registers
        |> registers.to_list
        |> list.index_map(fn(value, index) {
          html.tr([], [
            html.td([attribute.style(border_styles)], [
              text(index + 1 |> int.to_string),
            ]),
            html.td([attribute.style(border_styles)], [
              text(value |> int.to_string),
            ]),
          ])
        }),
    ),
  ])
}
