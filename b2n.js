"use strict";

/*
Copyright 2003-2014 Adrian H, Ray AF and Raisa NF
Private property of PT SOFTINDO Jakarta
All right reserved
*/

/*
  Excerpted from intex.js big integer object routines.

  This library will allow you to convert arbitrary length
  binary data/buffer o it's string hexa/decimals representation
  and vice-versa.

  functions:
    _buftoHexs(B);

      convert/translate binary data in buffer B (array of 32-bit integer)
      to hexadecimal numeric string.

    _buftoDecimals(B);

      convert/translate binary data in buffer B (array of 32-bit integer)
      to decimal numeric string.

    _numstoBuf(NumberStr);

      store/convert/translate hexa/decimals numeric string to binary data
      (array of 32-bit integer)

*/

/*
//function _padz(str, blocklength) {
//  if (blocklength < 2) return str;
//  blocklength &= 0xfffe;
//  var zeroes = '00000000';
//  while (zeroes.length < blocklength) zeroes += zeroes;
//  // if (blocklength < zeroes.length) zeroes = zeroes.substr(0, blocklength);
//  var pad = blocklength - (str.length % blocklength);
//  pad %= blocklength;
//  return zeroes.substr(0, pad) + str;
//}
*/

var _buftoHexs = function(B) {
  function pv(n) { return n < 0 ? n + 0x100000000 : n; }
  var s = '', zeroes = '00000000', zn = zeroes.length;
  var top = B.length - 1;

  if (top >= 0)
    s = pv(B[top]).toString(16);
  var n = 0;
  for (var i = top - 1; i >= 0; i--) {
    var hex = pv(B[i]).toString(16);
    //unobvious smart-ass
    //hex = '00000000'.substr(0, 8 - ((hex.length - 1) & 7) + 1) + hex;
    var pad = 8 - hex.length;
    s += '00000000'.substr(0, pad);
    s += hex;
  }
  return s;
}

var _buftoDecimals = function (B) {

  var POSITIVIZE = [0, 0x100000000];
  var zeroes = [0];
  var rcx32r = [[34078+0,20971], [60293,47185],
    [20971+0,7864], [47185+0,34078], [7864,60293]];
  var rcx64r = [[0xa3d,0xa3d7], [0xd70a,0x70a3],
    [0xa3d7,0x3d70], [0x70a3+0,0xa3d], [0x3d70+0,0xd70a]];

  function xRCPX(n, r, m)
    //{  m = m |0; return _fxMul16r(n, rcx32r[m][0], rcx32r[m][1], r); }
    {  m = m |0; return _fxMul16r(n, rcx64r[m][0], rcx64r[m][1], r); }

  function _fxDouble(A, top) {
    var a = 0, ovr = 0, ovs = 0, i = 0;
    for (i = 0; i<= top; i++) {
      a = A[i];
      ovs = +(a >= 0x80000000);
      A[i] = a + a + ovr - POSITIVIZE[ovs];
      ovr = ovs;
    }
    // we usually do not write over the top
    if (ovr) A[top + 1] = 1;
  }

  function _fxbClone(A, top, low) {
    var D = [];
    for (low = low|0; low <= top; low++)
      D[low] = A[low];
    return D;
  }

  function _fxbCopy(A, B, top, low) {
    B = []; var i = 0;
    for (low = low|0; low <= top; low++)
      B[i++] = A[low];
    return B;
  }

    function _unshiftn(A, n, top) {
      if (n < 1) return A;
      for (var i = top + n; i >= n; i--) A[i] = A[i - n];
      for (var i = 0; i < n; i++) A[i] = 0;
      return A;
    }

    function _copyshift(A, n, top) {
      var D = [];
      for (var i = 0; i < n; i++) D[i] = 0;
      for (var i = n; i <= top + n; i++) D[i] = A[i - n];
      return D;
    }

  function _fxbinroll5(A, top1, y) {
    //if (y < 1) A = [];
    if (y < 2 || top1 < 5) return A;
    var C = _fxbClone(A, top1, 0);
    var i = 0, j = 0, r = y;
    var k5 = top1 - 4;
    var rsum = 0, lsum = 0;

////top = length - 1, correlations:
////
//// // top / 5 + 1 is identical with (length + 4) / 5;
//// // top % 5 + 1 is identical with based-1's (length + 4) % 5;
//// // => top % 5 + 1 = [1,2,3,4,5]  whereas (length + 4) % 5 = [0,1,2,3,4]
//// // 
//// // given: length % 5 = (length +5 +5 +5..) % 5
//// // since: top % 5 is.. (length - 1) % 5,
//// //                    or (length +5 -1) %5,
//// //                      or (length + 4) % 5
//// // then:  top % 5 is identical with (length + 4) % 5;
//// //

    // thread-0
    if (y > 2) {
      // this formula taken rounds/rolls as modulo of blocks
      // result might be inapropiate after rounds pass over length
      //
      // k5 %= 5;
      // if (!k5) k5 = 5; // important!
      // var blocks = top1 / 5 + 1 |0; // 1-based
      // r %= blocks;
      // if (r)
      //   k5 += (blocks - r) * 5; // what the heck is this k5 doing?
      //                           // so.. convoluted :(
      // 
      // // this is stupid, k5 is nothing more than length minus rolls * 5
      // // k5 = (top + 1) - (y - 1) * 5 // rounds is 1-based
      // // or k5 = length - y * 5 + 5
      // //
      // // oh, i remember, it is designed to support for rolls > length
      // // if rolls more than length, k5 will be negative using that formula
      // // must be restricted with max value as : top1 div 5 * 5
      // // or (if zero or negative) k5 = top1 % 5 + 1
      // //
      // // actually for this case, rolls *always* less than length
      k5 = top1 + 1 - y * 5 + 5;
      if (k5 < 1) k5 = top1 % 5 + 1

      for (var i = k5; i <= top1 - 5; i++) {
        lsum = C[i];
        for (j = i + 5; j <= top1; j += 5)
          lsum += C[j];
        C[i] = lsum;
      }
    }
    //  Illustration:
    //  R|roll|rollroll|roll|roll|roll|roll|idx
    //    --------------------------------------
    //  1.                gfedcba9876543210|
    //  2.           gfedcba9876543210     |
    //  3.      gfedcba9876543210          |
    //  4. gfedcba9876543210               |
    //    --------------------------------------
    //          gfedcgfedcgfedcba9876543210|
    //               ba987ba9876543210     |
    //                    6543210          |
    // thread-1
    for (i = top1; i >= 5; i--) {
      r = y;
      rsum = A[i];
      for (j = i - 5; j >= 0; j -= 5) {
        if (--r < 1) break;
        rsum += A[j];
      }
      A[i] = rsum;
    }
    var top2 = top1;
    
    // may run only after both threads completed
    for (i = k5; i <= top1; i++)
      // note for index [i + top1]:
      // safe only for this case, since rolls always intersects
      // (roll count based on B.length (div 5), whereas,
      // the rolled buffer is B after multiplied by rcpx,
      // thus the rolled buffer length larger than B.length
      // and the buffer never shifted over/past buffer length).
      // on the other case the shift offset must be calculated
      // based on actual roll count plus offset (mod distance).
      A[++top2] = C[i];
    _fxbNormalize(A, top2, 0);
    return A;
  }

  var _fxbMulRcpZ = function(B, top){
    var A = [[]], D = [], q = [0,0];
    var i = 0, j = 0, k = top %5;

    var top1 = top + 1, r = k;
    var iter = top < 4 ? top : 4;

    // iteration could be run in separate thread
    for (j = 0; j <= iter; j++) {

      //var D = B.slice(0);
      var D = _fxbClone(B, top)

      q[1] = 0;
      for (i = 0; i <= top; i++) {
        q = xRCPX(D[i], q[1], r);
        D[i] = q[0];
      }

      D[top1] = q[1];
      A[j] = D;
      if (--r < 0)
        r = 4;
    }

    var rollcount = top / 5 |0;
    var r1 = 0;

    // iteration could be run in separate thread
    for (j = 0; j <= iter; j++) {
      r1 = rollcount + (j <= k); // efectively make it 1-based rolls
      _fxbinroll5(A[j], top1, r1);
      _unshiftn(A[j], j, A[j].length - 1);
    }

    //if (!k || k & 2) // 32r: 0,2,3
    if (k > 2) // 64r: 3,4
      _fxDouble(B, top);


    for (j = 0; j <= iter; j++)
      _fxbAddEx(B, A[j], B.length -1, A[j].length -1);

    A = [];
    return B;
  }// END _fxbMulRcpZ(B, top) *****************************

  function _fxbSub(A, B, top1, top2) {
  // will NOT write over A's top1
    var a, i, ovr = 0;
    // proceed normally until substractor exhausted
    var m = Math.min(top1, top2);
    for (i = 0; i <= m; i++) {
      a = A[i] - B[i] - ovr;
      ovr = +(a < 0)
      A[i] = a + POSITIVIZE[ovr]
    }
    if (ovr) {
      while (i <= top1 && !A[i]) { // A[i] == 0 ?
        A[i] = 0xffffffff; // extend sign resulted from zero minus (carry)
        i++;
      }
      if (i <= top1) {
        A[i]--;
        ovr = 0;
      }
    }
    return ovr; // tired of returning objects, we return carry flag now.
  }

  function _fxbSubEx(A, B, Len1, top2) {
    // A will be extended if smaller than B, Len1 is A.length-1
    var a, b, i, ovr = 0;
    while (Len1 < top2) A[++Len1] = 0;
    for (i = 0; i <= top2; i++) {
      a = A[i] - B[i] - ovr;
      ovr = +(a < 0)
      A[i] = a + POSITIVIZE[ovr]
    }
    if (ovr) {
      while (i <= Len1 && !A[i]) {
        A[i] = 0xffffffff;
        i++;
      }
      if (i > Len1) A[i] = 0xffffffff;
      else {
        ovr = 0;
        A[i]--;
      }
    }
    return ovr;
  }

  function _fxbAddEx(A, B, Len1, top2) { // A + B, result saved in A;
  // A will be extended if smaller than B, Len1 is A.length-1
    var a, i, ovr = 0;// , Len1 = A.length - 1;
    while (Len1 < top2) A[++Len1] = 0;
    for (i = 0; i <= top2; i++) {
  	a = A[i] + B[i] + ovr;
      ovr = +(a >= 0x100000000)
      A[i] = a - POSITIVIZE[ovr]
    }
    if (ovr) {
      while (i <= Len1 && !~A[i]) { // A[i] == -1 ?
        A[i] = 0;
        i++;
      }
      if (i > Len1)
        A[i] = 1;
      else {
        ovr = 0;
        A[i]++;
      }
    }
    return ovr;
  }

  function _fxbNormalize(B, top, bot) {
  // normalize array of overflowed integers
    bot = bot |0;
    var a, cr = 0;
    for (var i = bot; i <= top; i++) {
      a = B[i] + cr;
      cr = +(a >= 0x100000000)
      if (cr) {
        cr = (a / 0x100000000) |0;
        a &= 0xffffffff;
        if (a < 0) a += 0x100000000;
      }
      B[i] = a;
    }
    if (cr)
      if (B[++top]) B[top]++
      else B[top] = 1;
  }

  function _fxbInc1(B, top) {
    var i = 0;
    while (i <= top) {
      if (!~B[i]) B[i] = 0;
      else {
        B[i]++;
        break;
      }
      i++;
    }
    return B;
  };

  function _fxbDec1(B, top) {
    var i = 0;
    while (i <= top) {
      if (!B[i]) B[i] = 0xffffffff;
      else {
        B[i]--;
        break;
      }
      i++;
    }
    return B;
  };

  function _fxbShrr(B, shift, top) {
    var i, rev = 32 - shift;
    var d0 = B[0], d1 = B[1]
    var d0s = d0 >>> shift, d1r = d1 << rev, d0x = d0s | d1r;
    // intentionally left the last shift to simplify calculation
    for (i = 0; i < top - 1; i++) { // note: do NOT change the (k-1)
      B[i] = d0x + POSITIVIZE[+(d0x < 0)]; // JS special, make it positive
      d0 = d1;
      d1 = B[i + 2];
      d0s = d0 >>> shift;
      d1r = d1 << rev;
      d0x = d0s | d1r;
    }
    B[top - 1] = d0x + POSITIVIZE[+(d0x < 0)];
    B[top] >>>= shift;
    return B;
  }

  // continuous multiplication with previous reminder
  function _fxMul32r(a, b, r)
    { return _fxMul16r(a, b& 0xffff, b>>>16, r); }

  function _fxMul16r(n, eLo, eHi, r) {
    var xLo = n * eLo, xHi = n * eHi, ovr = 0;
    var a0 = xLo & 0xffffffff, a1 = xHi << 16;
    if (a0 < 0) a0 += 0x100000000;
    if (a1 < 0) a1 += 0x100000000;

    var lo = a0 + a1 + r;
    if (lo >= 0x100000000) {
      ovr++;
      lo -= 0x100000000;
      if (lo >= 0x100000000) { // r might caused double carry
        ovr++;
        lo -= 0x100000000;
      }
    }
    var b0 = (xLo / 0x100000000) |0;
    var b1 = (xHi / 0x10000) |0; // don't do shiftright, over 32bits value!
    if (b1 < 0) b1 += 0x100000000; // turn out b1 can be signed!
    var hi = b0 + b1 + ovr;
    return [lo, hi];
  }

  function _fxbMul1e2(B, top) {
    var a, b, c, r = 0;
    for(var i = 0; i <= top; i++) {
      //a = B[i];
      b = B[i] * 100 + r;
      c = b & 0xffffffff;
      B[i] = c + POSITIVIZE[+(c < 0)]
      r = (b / 0x100000000) |0;
    }
    return B;
  }

  function _bsr2(n, start) {
  var i = 0, i12 = 11, i20 = 19;
  var a = [1,2,4,8,
    0x10,0x20,0x40,0x80,
    0x100,0x200,0x400,0x800,
    0x1000,0x2000,0x4000,0x8000,
    0x10000,0x20000,0x40000,0x80000,
    0x100000,0x200000,0x400000,0x800000,
    0x1000000,0x2000000,0x4000000,0x8000000,
    0x10000000,0x20000000,0x40000000,0x80000000,
    0x100000000];
    if (n < 0) n = (n | 0) + 0x100000000;
    if (n < 3) return n - 1;
    if ((n & 0x80000000) != 0) return 31;
    if (n > 0x80000) while (++i20 < 32) if (n < a[i20]) return i20 - 1;
    if (n > 0x800) while (++i12 < 32) if (n < a[i12]) return  i12 - 1;
    while (++i < 32) if (n < a[i]) return  i - 1;
    return -1; // too high, not an integer!
  }

  /*********** ENTRY POINT *******************/
  var top = 0; 
  var _A0 = [], strn = [], rets = [];
  //var mulfn = _fxbMulRcpZ;

  function __init() {
    _A0 = B;
    B = B.slice(0); // release original B;
    top = B.length;

    var i = 0;
    for (i = 0; i < top; i++) {
      B[i] |= 0;
      if (B[i] < 0) B[i] += 0x100000000;
    }

    while (top && B[--top] == 0) B.pop();

    // WARNING! 16Kbits need 38+ seconds in Chrome-38, 43 seconds in
    // opera 12.16. 16Kbits not tested in other browser. Opera lag a
    // small bit behind Chrome-38, Firefox-35 is twice slower, IE9
    // thrice to fifth times slower. For 8192 bits: Chrome/Opera got
    // it by 4+ seconds, firefox-35: 9+ seconds, while IE9 by 25 seconds!
    // Computer: i5-3570K-underclocked 1.800Ghz
    //
    // update: firefox-4.01 is the winner: crunching 16KB by 27.2 secs!
    // (and thats with tons of addons: firebug+ addons, httpfox,
    // adblockplus, noscript, ghostery, and many more..).
    // The slow, latest firefox-35 is a BIG dissapoinment!
    //
    // update: pullout some subroutines. apparently firefox doesn't
    // like it much, the performance down to 32 sec/16KB, even when
    // cpu boosted to 2.4GHz, opera 12.16 make it by 30 sec now, and
    // chrome-38 by 25 secs.
    // pull back in routines, firefox-4.01 got it's crown back by 22 sec.
    //
    // update: using new algorithm. 16KB translated by 6.5 second
    //         in Opera 12.16
    //
    // welcome 32KB! that's nearly 10000 chars length! we may
    // now test them :) 38.7 sec in opera 12.16. 27.6 secs in
    // old firefox-4.01 and about the same in chrome-38.
    // note: PC unchanged, i5-3570K underclocked-2.4GHz
    //
    // update: cleanup. 16KB under 5 seconds in firefox 4.01,
    //         and a mere 2.2 seconds in chrome! 32KB now only
    //         spent 12 seconds in chrome! don't know why, but
    //         tested result in bc is correct.
    //
    //  Curious how long now ie9 got 16KB? 85 seconds! :), but now it
    //  can get 4KB by 1.5 seconds and 8KB by 11 seconds. Considering
    //  that RSA crypto at most use only 2048K (0.25 sec in IE),
    //  it is still functionally OK.
    //
    //  firefox, about:config, dom.min_background_timeout_value
    //                         dom.max_script_run_time
    //  chrome, chrome://flags
    //  opera, opera:config
    //
    // update: trimmed even further, gosh!
    //         reduce repeated array elements write-access
    //         IE may be dog slowest, but I often got performance
    //         enhancement like this by examining it's nice profiler.
    // (final result below, under PC: i5-3570K-underclock-2.4GHz)
    //
    //   bits / time (seconds)
    //          IE9        Opera-12.16  Firefox-4.01  Chrome-38
    // ---------------------------------------------------------------
    //   32KB:  too-long!  26.8         23.2          9.8
    //   16KB:  54.3        5.0          4.4          2.00
    //    8KB:   7.4        1.0          0.9          0.4
    //    4KB:   1.2        0.24         0.23         0.1
    //    2KB    0.2        0.06         0.06         0.0
    // ---------------------------------------------------------------
    //   64KB   no-bother  not-tested   not-tested   55.2
    //
    //   note: tested in firefox-9.0.1, 64KB consumes 88.1 seconds.
    //         32KB: 15.1 seconds, 16KB: 2.8s, 8KB: 0.64s, 4KB: 0.13s
    //
    // I guess I would better stop now and do my (abandoned) real job.

    // var top10 = top * 3.2 |0;
    // for (i = 0; i <= top10; i++) rets[i] = '';
    if (strn.length < 1) {
      for (i = 90; i < 100; i++) strn[i - 90] = '' + i;
      for (i = 0; i < 10; i++) strn[i + 10] = '0' + i;
      for (i = 10; i < 100; i++) strn[i + 10] = '' + i;
      for (i = 100; i < 110; i++) strn[i + 10] = '' + (i - 100);
    }

  }
  /*********** ENTRY POINT *******************/

  function __bin2dec() {
    //if (itr > 1000) return '';
    if (top < 0) return '';
    if (top < 2)
      if (top == 0) {
        top = -1;
        return '' + B[0];
      }
      else {
        var msb = _bsr2(B[top]);
        // damn!!! can't we rely on js for this end, even 22 is TOO HIGH!
        if (msb < 22 - 1) {
          top = -1;
          return '' + (B[1] * 0x100000000 + B[0]);
        }
      }

    var C = [], D = [];

    D = _fxbClone(B, top);
    _fxbMulRcpZ(D, top);

    D = D.slice(top + 1);

    //_fxbShrr(D, 5, top); // 32r
    _fxbShrr(D, 6, top); // 64r

    C = B.slice(0);
    B = D.slice(0);

    _fxbMul1e2(D, top);
    _fxbSub(C, D, top + 1, top);

    var r = C[0]; // & 127;

    C = [];
    D = [];

    r |= 0;
    if (r < 0) {
      _fxbDec1(B, top);
      console.log('i:'+ itr + '; r=' + r + '; A = [' + _A0 + '];');
    }
    else
      if (r >= 100) {
        _fxbInc1(B, top);
      console.log('i:'+ itr + '; r=' + r + '; A = [' + _A0 + '];');
      }

    if (B[top] == 0) {
      B.pop();
      top--;
    }

    //return __bin2dec(top) + strn[r + 10];
    return strn[r + 10];
  };

  __init();
  if (top < 1) return B ? '' + B[0] : '0';
  // if (top > 256) return 'sorry, too much'; // over 8Kbits
  // if (top > 512) return 'sorry, too much'; // over 16Kbits
  // if (top > 1024) return 'sorry, too much'; // over 32Kbits
  // if (top > 2048) return 'sorry, too much'; // over 64Kbits
  var itr = 0;
  while (top > 0)
    rets[itr++] = __bin2dec();
  rets.reverse();
  return rets.join('');
};

var _numstoBuf = function(NumberStr) { // returns B;
  function _validatesnum(snumber, index) {
    index = index |0;
    var ValidChars = 'ABCDEFabcdef0123456789';
    var nums = snumber.split(''), len = nums.length;
    for (var i = 0; i < len; i++)
      if (ValidChars.indexOf(nums[i]) < index)
        nums[i] = '';
    return nums.join('');
  }

  function validHexStr(snumber) { return _validatesnum(snumber); }
  function validDecimalStr(snumber) { return _validatesnum(snumber, 10); }

  // accompanion for bintoDecimals, assign decimal string to binary buffer
  var _fxbdec2Buf = function(DecimalStr) {
    function _fxbMul1e1p(B, plus) {
    // multiply 10 and add with plus. plus must not negative.
    // used for translating decimal to buffer/hex
      var i, a, b, c, r = 0;
      var top = B.length -1;
      // multiplication
      for(i = 0; i <= top; i++) {
        b = B[i] * 10 + r;
        c = b & 0xffffffff;
        B[i] = c + POSITIVIZE[+(c < 0)]
        r = (b / 0x100000000) |0;
      }
      if(r)
        B[++top] = r;
      if (!plus)
        return B;
      // now addition
      a = B[0] + plus;
      r = (a >= 0x100000000)
      if (!r)
        B[0] = a;
      else {
        B[0] = a - 0x100000000;
        for (i = 1; i <= top; i++) {
          if (~B[i]) { // not all  bit set
            B[i]++;
            r = 0;
            break;
          }
          else // all bit set (-1 in signed int term)
            B[i] = 0;
        }
        if (r)
          B[i] = 1; // still carry? write over
      }
      return B;
    }

    DecimalStr = validDecimalStr(DecimalStr);
    var B = [0], n = +DecimalStr;
    if (n < 0x20000000000000) { //CAP53
      B[0] = parseInt(n % 0x100000000); //CAP32

      B[1] = (n / 0x100000000) | 0; //CAP32
      return B;
    }
    var decs = DecimalStr.split('');
    var i = 0, len = decs.length;
    for (var i = 0; i < len; i++) {
      n = +decs[i];
      if (n >= 0 && n <= 9)
        _fxbMul1e1p(B, n)
    }
    return B;
  };

  // accompanion for bintoDecimals, assign hexstring to binary buffer
  function _fxbhex2Buf(HexStr) {
    HexStr = validHexStr(HexStr);
    //var hexs = '00000000'.substr(0, 8 - (((HexStr.length - 1) & 7) + 1)) + HexStr;
    var pad = 8 - (HexStr.length & 7);
    pad &= 7;
    var hexs = '00000000'.substr(0, pad) + HexStr;
    var hexses = hexs.match(/.{8}/g);

    var B = [];
    var len = hexses.length;
    for (var i = 0; i < len; i++)
      B[i] = +('0x' + hexses[len - i - 1]);
    return B;
  };

  var n = NumberStr.indexOf('0x');
  var B = [];
  if (n < 0)
    B = _fxbdec2Buf(NumberStr);
  else
    B = _fxbhex2Buf(NumberStr.substr(n + 2));

  return B;
};

