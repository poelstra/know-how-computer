import lustre/attribute
import lustre/element.{type Element, text}
import lustre/element/html
import lustre/ui
import lustre/ui/icon
import lustre/ui/prose
import ui/model.{type Model, Model}
import ui/msg.{type Msg}
import ui/program_controller
import ui/program_editor
import ui/register_editor

// VIEW ------------------------------------------------------------------------

pub fn view(model: Model) -> Element(Msg) {
  ui.box([], [
    html.h1([], [text("Know-How Computer")]),
    ui.prose([prose.full()], [
      html.p([], [
        text(
          "Welcome to the online Know How Computer emulator, a tool to learn more about how a computer really works.",
        ),
      ]),
      html.p([], [
        text("See the "),
        html.a(
          [
            attribute.href(
              "https://github.com/poelstra/know-how-computer/blob/main/README.md",
            ),
            attribute.target("_blank"),
          ],
          [text("online documentation"), icon.external_link([])],
        ),
        text(
          " for more explanation, some examples and challenges for you to try!",
        ),
      ]),
    ]),
    html.h3([], [text("Registers")]),
    register_editor.view(model),
    html.h3([], [text("Program")]),
    program_controller.view(model),
    program_editor.view(model),
  ])
}
