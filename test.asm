  // Example raster bar
  sei

  lda #$7f  // fill bits to 0 (8th bit sets all other bits)
  sta $dc0d // interupts
  sta $dd0d
  lda $dc0d // ack them
  lda $dd0d

  lda #1
  sta $d01a // raster enable
  lda #<irq
  ldx #>irq
  sta $0314
  stx $0315

  lda $d011 // Clear 8th raster bit (bit 7 of $d011)
  and #$7f
  sta $d011
  lda #$ff  // Set raster line
  sta $d012
  asl $d019 // Ack raster interuppt
  inc $d020
  cli

  lda #$0
  sta $3
  rts

irq:

ras:
  lda #$7f
  cmp $d012
  bne ras
  ldx $3 // magic number to push to right border
!:
  dex
  bne !-

  ldy #$5  // number of lines in raster bar

line:
  lda cols,y
  sta $d020
  sta $d021
  ldx #$9
!:
  dex
  bne !-
  dey
  bne line

  lda #0
  sta $d020
  sta $d021

  inc $3

  asl $d019 // Ack raster
  jmp $EA31

cols: .byte 0,$b,3,1,3,$b
