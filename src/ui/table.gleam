import gleam/list
import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html

pub fn table(data: List(List(String))) -> Element(a) {
  let border_styles = [#("border", "1px solid")]
  html.table([attribute.style(border_styles)], [
    // html.thead([], [
    //   html.tr([], [html.th([], [text("#")]), html.th([], [text("Value")])]),
    // ]),
    html.tbody(
      [attribute.style(border_styles)],
      data
        |> list.map(fn(row) {
          html.tr(
            [],
            row
              |> list.map(fn(col) {
                html.td([attribute.style(border_styles)], [text(col)])
              }),
          )
        }),
    ),
  ])
}
