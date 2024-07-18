pub type Msg {
  Undo
  Reset
  Step
  Run
  ProgramLinesChanged(lines: List(String))
  RegisterLinesChanged(lines: List(String))
}
