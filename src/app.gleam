import lustre
import ui/app
import ui/codemirror
import ui/model
import ui/update

pub fn main() {
  codemirror.install()
  let app = lustre.application(model.init, update.update, app.view)
  let assert Ok(_) = lustre.start(app, "#app", 0)

  Nil
}
