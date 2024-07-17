pub type Msg {
  Undo
  Reset
  Step
  Run
  LinesChanged(lines: List(String))
  RegisterLinesChanged(lines: List(String))
}
