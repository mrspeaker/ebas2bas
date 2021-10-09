10 poke 53280,0: poke 53281,0
20 v=53248:mask=28
30 poke v+21,mask
40 poke 2042,13:poke 2043,13:poke 2044,13
50 for n=0 to 62 :read q :poke 832+n,q :next
60 poke v+23,mask:poke v+29,mask
70 for n=4 to 9:poke v+n, n*20:next
80 n=0
90 print "{clear}"
100 poke 646,n:n=n+1
110 print "coding is basic ...  ";
120 goto 100
130 data 0,127,0,1,255,192,3,255,224,3,231,224
140 data 7,217,240,7,223,240,7,217,240,3,231,224
150 data 3,255,224,3,255,224,2,255,160,1,127,64
160 data 1,62,64,0,156,128,0,156,128,0,73,0,0,73,0
170 data 0,62,0,0,62,0,0,62,0,0,28,0