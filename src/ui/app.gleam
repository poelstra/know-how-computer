import lustre/element.{type Element, text}
import lustre/element/html
import lustre/ui
import ui/model.{type Model, Model}
import ui/msg.{type Msg}
import ui/program_controller
import ui/program_editor
import ui/register_editor

// VIEW ------------------------------------------------------------------------

pub fn view(model: Model) -> Element(Msg) {
  ui.box([], [
    html.h1([], [text("Know-How Computer")]),
    html.h3([], [text("Registers")]),
    register_editor.view(model),
    html.h3([], [text("Control")]),
    program_controller.view(model),
    program_editor.view(model),
  ])
}
