pub type Msg {
  Nop
  Undo
  Reset
  Step
  Run
  Pause
  AutoRun
  SetActiveLineToSelection
  ProgramLinesChanged(lines: List(String))
  RegisterLinesChanged(lines: List(String))
  BreakpointsChanged(bps: List(Int))
  SelectedLineChanged(line_no: Int)
}
