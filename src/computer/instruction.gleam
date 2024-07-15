pub type Instruction {
  Nop
  Inc(reg: Int)
  Dec(reg: Int)
  Isz(reg: Int)
  Jmp(addr: Int)
  Stp
}
