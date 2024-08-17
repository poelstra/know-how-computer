import computer/compiler
import computer/program
import computer/registers
import computer/runtime
import computer/source_map
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import gleam/queue
import gleam/result
import lustre/effect.{type Effect}
import ui/model.{type Model, Model}
import ui/msg.{type Msg}

// UPDATE ----------------------------------------------------------------------

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  // TODO Perhaps I should extract invocation of the runtime to an effect
  case msg {
    msg.Nop -> #(model, effect.none())

    msg.AutoRun ->
      case model.rt |> runtime.get_pc {
        runtime.Running(_) -> do_run(model)
        _ -> #(model, effect.none())
      }

    msg.Run -> do_run(model)

    msg.Pause ->
      case model.rt |> runtime.get_pc {
        runtime.Running(_) -> #(
          Model(
            ..model,
            rt: model.rt |> runtime.pause,
            history: model.history |> queue.push_front(model.rt),
          ),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }

    msg.Step -> #(
      Model(
        ..model,
        rt: model.rt |> runtime.step,
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )

    msg.Reset -> #(
      Model(
        ..model,
        rt: model.rt |> runtime.reset(),
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )

    msg.Undo ->
      case model.history |> queue.pop_front() {
        Ok(#(head, rest)) -> #(
          Model(..model, rt: head, history: rest),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }

    msg.SetActiveLineToSelection -> {
      case
        model.rt
        |> runtime.get_program
        |> program.get_source_map
        |> source_map.get_program_line(model.selected_line)
        |> result.try(fn(program_line) {
          runtime.set_addr(model.rt, program_line) |> result.nil_error
        })
      {
        Ok(rt) -> #(
          Model(
            ..model,
            rt: rt,
            history: model.history |> queue.push_front(model.rt),
          ),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }
    }

    msg.ProgramLinesChanged(lines) -> {
      let model = Model(..model, lines: lines, compile_errors: [])
      case compiler.compile(lines) {
        Ok(program) -> {
          let rt = model.rt |> runtime.set_program(program)
          #(
            Model(
              ..model,
              rt: rt,
              history: model.history |> queue.push_front(model.rt),
            ),
            effect.none(),
          )
        }
        Error(errors) -> #(
          Model(..model, compile_errors: [errors]),
          effect.none(),
        )
      }
    }

    msg.RegisterLinesChanged(lines) -> {
      case
        lines
        |> list.try_map(int.parse)
        |> result.map(registers.from_list)
      {
        Ok(regs) -> #(
          Model(
            ..model,
            rt: model.rt |> runtime.set_registers(regs),
            history: model.history |> queue.push_front(model.rt),
            register_lines: None,
          ),
          effect.none(),
        )
        Error(_) -> #(
          Model(..model, register_lines: Some(lines)),
          effect.none(),
        )
      }
    }

    msg.BreakpointsChanged(bps) -> {
      let sm =
        model.rt
        |> runtime.get_program
        |> program.get_source_map

      case bps |> list.map(source_map.get_program_line(sm, _)) |> result.all {
        Ok(program_bps) -> #(
          Model(..model, breakpoints: program_bps),
          effect.none(),
        )
        _ -> #(model, effect.none())
      }
    }

    msg.SelectedLineChanged(line_no) -> #(
      Model(..model, selected_line: line_no),
      effect.none(),
    )
  }
}

fn do_run(model: Model) -> #(Model, Effect(Msg)) {
  let rt = model.rt |> runtime.run(100, model.breakpoints)
  case rt |> runtime.get_pc {
    // Iterations exceeded, keep running on next tick
    runtime.Running(_) -> #(Model(..model, rt: rt), next_tick(msg.AutoRun))
    // Done running & add to history
    _ -> #(
      Model(
        ..model,
        rt: rt,
        history: model.history |> queue.push_front(model.rt),
      ),
      effect.none(),
    )
  }
}

fn next_tick(msg: a) -> Effect(a) {
  effect.from(fn(dispatch) { set_timeout(0, fn() { dispatch(msg) }) })
}

@external(javascript, "../ffi.mjs", "set_timeout")
fn set_timeout(_ms: Int, _cb: fn() -> a) -> Nil {
  panic as "not implemented on this target"
}
