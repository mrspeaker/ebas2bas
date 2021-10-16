10 rem ebas2bas example
20 v=53248
30 rem set screen colors via asm
40 data 169,0,141,32,208,141,33,208,96
50 for za = 0 to 8
60 read zb:poke 49152+za,zb:next za
70 sys 49152
80 mask=28
90 poke v+21,mask
100 poke 2042,13:poke 2043,13:poke 2044,13
110 for n=0 to 62 :read q :poke 832+n,q :next
120 poke v+23,mask:poke v+29,mask
130 for n=4 to 9:poke v+n,n*15:next
140 poke v+18,23
150 print "{clear}"
160 print "{gry3}are you keeping up with ";
170 print "{wht}t{red}h{cyn}e{pur} {grn}c{blu}o{yel}m{orn}m{brn}o{lred}d{gry1}o{gry2}r{lgrn}e? "
180 goto 160
190 data 0,127,0,1,255,192,3,255,224,3,231,224
200 data 7,217,240,7,223,240,7,217,240,3,231,224
210 data 3,255,224,3,255,224,2,255,160,1,127,64
220 data 1,62,64,0,156,128,0,156,128,0,73,0,0,73,0
230 data 0,62,0,0,62,0,0,62,0,0,28,0