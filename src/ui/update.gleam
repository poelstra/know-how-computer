pub type Msg {
  Undo
  Reset
  Step
  Run
  Pause
  AutoRun
  ProgramLinesChanged(lines: List(String))
  RegisterLinesChanged(lines: List(String))
}
