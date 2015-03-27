# bin2dec
High performance javascript binary stream data to hexa/decimal convertor

  This library will allow you to convert arbitrary length
  binary stream data/buffer to it's string hexa/decimals representation
  and vice-versa.

=======

This is a *very fast* javascript binary stream data to hexa/decimal convertor.
In fact, I would like to challenge everyone (in a friendly competition/manner) to produce library faster than this.

Please see the notes in source code for any question about algorithm and optimization used.


  functions:

    _buftoHexs(B);

      convert/translate binary stream data in buffer B (array of 32-bit integer)
      to hexadecimal numeric string.

    _buftoDecimals(B);

      convert/translate binary stream data in buffer B (array of 32-bit integer)
      to decimal numeric string.

    _numstoBuf(NumberStr);

      store/convert/translate hexa/decimals numeric string to binary stream data
      (array of 32-bit integer)
