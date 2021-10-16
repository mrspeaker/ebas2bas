10 rem ebas2bas example
20 v=53248
30 mask=28
40 poke v+21,mask
50 poke 2042,13:poke 2043,13:poke 2044,13
60 for n=0 to 62 :read q :poke 832+n,q :next
70 poke v+23,mask:poke v+29,mask
80 for n=4 to 9:poke v+n,n*15:next
90 poke v+18,23
100 print "{clear}"
110 print "{gry3}are you keeping up with ";
120 print "{wht}t{red}h{cyn}e{pur} {grn}c{blu}o{yel}m{orn}m{brn}o{lred}d{gry1}o{gry2}r{lgrn}e? "
130 goto 110
140 data 0,127,0,1,255,192,3,255,224,3,231,224
150 data 7,217,240,7,223,240,7,217,240,3,231,224
160 data 3,255,224,3,255,224,2,255,160,1,127,64
170 data 1,62,64,0,156,128,0,156,128,0,73,0,0,73,0
180 data 0,62,0,0,62,0,0,62,0,0,28,0