10 rem ebas2bas example
20 v=53248
30 rem set screen colors via asm
40 data 169,0,141,32,208,141,33,208,96
50 for za = 0 to 8
60 read zb:poke 49152+za,zb:next za
70 sys 49152
80 rem test include asm file
90 data 120,169,127,141,13,220,141,13,221,173,13,220,173,13,221,169
100 data 1,141,26,208,169,64,162,192,141,20,3,142,21,3,173,17
110 data 208,41,127,141,17,208,169,255,141,18,208,14,25,208,238,32
120 data 208,88,169,0,133,3,96,169,127,205,18,208,208,249,166,3
130 data 202,208,253,160,5,185,111,192,141,32,208,141,33,208,162,9
140 data 202,208,253,136,208,239,169,0,141,32,208,141,33,208,230,3
150 data 14,25,208,76,49,234,0,11,3,1,3,11
160 for za = 0 to 107
170 read zb:poke 49161+za,zb:next za
180 sys 49161
190 mask=28
200 poke v+21,mask
210 poke 2042,13:poke 2043,13:poke 2044,13
220 for n=0 to 62 :read q :poke 832+n,q :next
230 poke v+23,mask:poke v+29,mask
240 for n=4 to 9:poke v+n,n*15:next
250 poke v+18,23
260 print "{clear}"
270 print "{gry3}are you keeping up with ";
280 print "{wht}t{red}h{cyn}e{pur} {grn}c{blu}o{yel}m{orn}m{brn}o{lred}d{gry1}o{gry2}r{lgrn}e? "
290 goto 270
300 data 0,127,0,1,255,192,3,255,224,3,231,224
310 data 7,217,240,7,223,240,7,217,240,3,231,224
320 data 3,255,224,3,255,224,2,255,160,1,127,64
330 data 1,62,64,0,156,128,0,156,128,0,73,0,0,73,0
340 data 0,62,0,0,62,0,0,62,0,0,28,0