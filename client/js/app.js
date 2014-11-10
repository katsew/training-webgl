var app = (function(){

  // make singleton instance.
  var _instance;

  function App () {

    // #pragma region - variables
    var c, // canvas
        gl, // webgl context
        vs, // vertex shader
        fs; // fragment shader

    // private context
    var _this = this;

    // #pragma region - private methods
    var _setVertexShader = function (shader) {
      vs = shader;
    };

    var _setFragmentShader = function (shader) {
      fs = shader;
    };

    var _hsva = function (h, s, v, a) {
      if (s > 1 || v > 1 || a > 1) return;
      var th = h % 360;
      var i = Math.floor (th / 60);
      var f = th / 60 - i;
      var m = v * (1 -s);
      var n = v * (1 -s * f);
      var k = v * (1 -s * (1 - f));
      var color = [];
      if (!s > 0 && !s < 0) {
        color.push (v, v, v, a);
      } else {
        var r = [v, n, m, m, k, v];
        var g = [k, v, v, n, m, m];
        var b = [m, m, k, v, v, n];
        color.push (r[i], g[i], b[i], a);
      }
      return color;
    };

    // #pragma region - public variables
    this.textures = [];
    this.rangeElement = null;
    this.rangeText = null;
    this.isTrans = null;
    this.isAdd = null;

    // #pragma region - public methods
    this.init = function(w, h, clearColor, depth){
      c = document.getElementById('canvas');
      c.width = w;
      c.height = h;

      gl = c.getContext('webgl') || c.getContext ('experimental-webgl');
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clearDepth (depth);
      gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      _this.rangeElement = document.getElementById('range');
      _this.rangeText = document.getElementById('rangeText');
      _this.rangeText.value = _this.rangeElement.value;
      _this.isTrans = document.getElementById('isTrans');
      _this.isAdd = document.getElementById('isAdd');
    };

    this.clearContext = function (clearColor, depth) {
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clearDepth (depth);
      gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    // getter, setter
    this.getVertexShader = function () {
      if (vs) return vs;
      throw new Error ('No vertex shader is assign. set vertex shader with method createShader (id).');
    };
    this.getFragmentShader = function () {
      if (fs) return fs;
      throw new Error ('No fragment shader is assign. set vertex shader with method createShader (id).');
    };

    this.getCanvas = function () {
      return c;
    };

    this.getContext = function () {
      return gl;
    };

    this.createShader = function (id) {
      var shader = null;
      var scriptElem = document.getElementById (id);
      if (!scriptElem) throw new Error('No such shader source element exists.');

      switch (scriptElem.type) {
        case 'x-shader/x-vertex':
          shader = gl.createShader(gl.VERTEX_SHADER);
          break;
        case 'x-shader/x-fragment':
          shader = gl.createShader(gl.FRAGMENT_SHADER);
          break;
        default:
          return;
      }

      // assign source into generated shader
      gl.shaderSource(shader, scriptElem.text);

      // compile shader
      gl.compileShader(shader);

      // check compiled shader
      if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // if success, set (vertex/fragment) shader
        console.log ('success compile shader!');
        console.log (shader);

        switch (scriptElem.type) {
          case 'x-shader/x-vertex':
            _setVertexShader (shader);
            break;
          case 'x-shader/x-fragment':
            _setFragmentShader (shader);
            break;
          default:
            return;
        }
        return shader;

      } else {
        // if failure, throw error
        throw new Error (gl.getShaderInfoLog(shader));
      }

    };

    this.createProgram = function (vs, fs) {

      // create program object
      var program = gl.createProgram ();

      // assign program object into shader
      gl.attachShader (program, vs);
      gl.attachShader (program, fs);

      // link shader
      gl.linkProgram (program);

      // check link with the shader success
      if (gl.getProgramParameter (program, gl.LINK_STATUS)) {

        // if success, enable and return the program object
        gl.useProgram (program);

        return program;
      } else {
        // if failure, throw error
        throw new Error (gl.getProgramInfoLog (program));
      }
    };

    this.createVBO = function (data) {
      var vbo = gl.createBuffer ();

      // bind buffer
      gl.bindBuffer (gl.ARRAY_BUFFER, vbo);

      // set data in buffer
      gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (data), gl.STATIC_DRAW);

      // unbind buffer
      gl.bindBuffer (gl.ARRAY_BUFFER, null);

      return vbo;
    };

    this.createIBO = function (data) {
      var ibo = gl.createBuffer ();

      gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
      gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, null);

      return ibo;
    };

    this.createTexture = function (source, index) {
      var img = new Image ();

      img.onload = function () {
        var tex = gl.createTexture ();
        gl.bindTexture (gl.TEXTURE_2D, tex);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap (gl.TEXTURE_2D);
        gl.bindTexture (gl.TEXTURE_2D, null);

        _this.textures[index] = tex;
      }
      img.src = source;
    }

    this.setShaderAttrib = function (vbo, attL, attS) {

      for (var i in vbo) {
        gl.bindBuffer (gl.ARRAY_BUFFER, vbo[i]);
        gl.enableVertexAttribArray (attL[i]);
        gl.vertexAttribPointer (attL[i], attS[i], gl.FLOAT, false, 0, 0);
      }

    };

    this.setBlendingType = function (prm) {
      switch (prm) {
        case 0:
          gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          break;
        case 1:
          gl.blendFunc (gl.SRC_ALPHA, gl.ONE);
          break;
        default:
          break;
      }
    }

    this.createTorus = function (row, column, irad, orad, color) {
      var pos = [], col = [], idx = [], nor = [];
      for (var i=0; i <= row; i++) {
        var r = Math.PI * 2 / row * i;
        var rr = Math.cos (r);
        var ry = Math.sin (r);

        for (var ii=0; ii <= column; ii++) {
          var tr = Math.PI * 2 / column * ii;
          var tx = (rr * irad + orad) * Math.cos (tr);
          var ty = ry * irad;
          var tz = (rr * irad + orad) * Math.sin (tr);
          var rx = rr * Math.cos (tr);
          var rz = rr * Math.sin (tr);
          if (color) {
            var tc = color;
          } else {
            var tc = _hsva (360 / column * ii, 1, 1, 1);
          }
          pos.push (tx, ty, tz);
          nor.push (rx, ry, rz);
          col.push (tc[0], tc[1], tc[2], tc[3]);
        }
      }
      for (i = 0; i < row; i++) {
        for (ii = 0; ii < column; ii++) {
          r = (column + 1) * i + ii;
          idx.push (r, r + column + 1, r + 1);
          idx.push (r + column + 1, r + column + 2, r + 1);
        }
      }
      return {p: pos, n:nor, c:col, i:idx};
    };

    this.createSphere = function (row, column, rad, color) {
        var pos = new Array(), nor = new Array(),
            col = new Array(), idx = new Array();
        for(var i = 0; i <= row; i++){
            var r = Math.PI / row * i;
            var ry = Math.cos(r);
            var rr = Math.sin(r);
            for(var ii = 0; ii <= column; ii++){
                var tr = Math.PI * 2 / column * ii;
                var tx = rr * rad * Math.cos(tr);
                var ty = ry * rad;
                var tz = rr * rad * Math.sin(tr);
                var rx = rr * Math.cos(tr);
                var rz = rr * Math.sin(tr);
                if (color) {
                    var tc = color;
                } else {
                    var tc = _hsva(360 / row * i, 1, 1, 1);
                }
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(tc[0], tc[1], tc[2], tc[3]);
            }
        }
        r = 0;
        for(i = 0; i < row; i++){
            for(ii = 0; ii < column; ii++){
                r = (column + 1) * i + ii;
                idx.push(r, r + 1, r + column + 2);
                idx.push(r, r + column + 2, r + column + 1);
            }
        }
        return {p : pos, n : nor, c : col, i : idx};
    };

  }; // End of App


  // return singleton class.
  if ( _instance != undefined ) {
    return _instance;
  } else {
    _instance = new App ();
    return _instance;
  }

})();

window.onload = function(){

  // set clear color RGBA
  var clearColorArray = [0.0, 0.0, 0.0, 1.0];

  app.init(800, 600, clearColorArray, 1.0);
  var c = app.getCanvas ();
  var gl = app.getContext ();
  var vShader = app.createShader ('vs');
  var fShader = app.createShader ('fs');
  var prg = app.createProgram (vShader, fShader);

  var attLocation = [];
  attLocation[0] = gl.getAttribLocation (prg, 'position');
  attLocation[1] = gl.getAttribLocation (prg, 'color');
  attLocation[2] = gl.getAttribLocation (prg, 'textureCoord');

  var attStride = [];
  attStride[0] = 3;
  attStride[1] = 4;
  attStride[2] = 2;

  var position = [
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0
  ];

  var color = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0
  ];

  var textureCoord = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    1.0, 1.0
  ];

  var index = [
    0, 1, 2,
    3, 2, 1
  ];

  var vPosition = app.createVBO (position);
  var vColor = app.createVBO (color);
  var vTextureCoord = app.createVBO (textureCoord);
  var VBOList = [vPosition, vColor, vTextureCoord];
  var iIndex = app.createIBO (index);

  app.setShaderAttrib (VBOList, attLocation, attStride);
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, iIndex);

  var uniLocation = [];
  uniLocation[0] = gl.getUniformLocation (prg, 'mvpMatrix');
  uniLocation[1] = gl.getUniformLocation (prg, 'vertexAlpha');
  uniLocation[2] = gl.getUniformLocation (prg, 'texture');
  uniLocation[3] = gl.getUniformLocation (prg, 'useTexture');

  gl.activeTexture (gl.TEXTURE0);
  gl.bindTexture (gl.TEXTURE_2D, app.textures[0]);
  gl.uniform1i (uniLocation[1], 0);

  // create mat4 lib instance
  var m = new matIV ();

  // initialize matrixes
  var mMatrix = m.identity (m.create ());
  var vMatrix = m.identity (m.create ());
  var pMatrix = m.identity (m.create ());
  var tmpMatrix = m.identity (m.create ());
  var mvpMatrix = m.identity (m.create ());
  var invMatrix = m.identity(m.create());

  var lightPosition = [0.0, 0.0, 0.0];
  var ambientColor = [0.1, 0.1, 0.1, 1.0];
  var eyeDirection = [0.0, 0.0, 15.0];

  m.lookAt (eyeDirection, [0, 0, 0], [0, 1, 0], vMatrix);
  m.perspective (45, c.width / c.height, 0.1, 100, pMatrix);
  m.multiply (pMatrix, vMatrix, tmpMatrix);

  app.createTexture ('./img/test.jpg', 0);

  var count = 0;

  // gl.enable (gl.CULL_FACE);
  gl.enable (gl.BLEND);
  gl.enable (gl.DEPTH_TEST);
  gl.depthFunc (gl.LEQUAL);
  gl.blendFunc (gl.ONE, gl.ZERO);

  var animation = (function (w, r) {
    return w['r'+r] = w['r'+r] || w['webkitR'+r] || w['mozR'+r] || w['msR'+r] || w['oR'+r] || function(c){ w.setTimeout(c, 1000 / 60); };
  })(window, 'equestAnimationFrame');

  (function render () {

    var vertexAlpha = parseFloat (app.rangeElement.value / 100);
    app.rangeText.value = app.rangeElement.value;
    if (app.isTrans.checked) {
      app.setBlendingType (0);
    } else {
      app.setBlendingType (1);
    }
    app.clearContext(clearColorArray, 1.0);

    count++;
    var rad = (count % 360) * Math.PI / 180;


    m.identity(mMatrix);
    m.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix);
    m.rotate (mMatrix, rad, [0, 1, 0], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);
    
    gl.bindTexture (gl.TEXTURE_2D, app.textures[0]);
    gl.disable(gl.BLEND);

    gl.uniformMatrix4fv (uniLocation[0], false, mvpMatrix);
    gl.uniform1f (uniLocation[1], 1.0);
    gl.uniform1i (uniLocation[2], 0);
    gl.uniform1i (uniLocation[3], true);
    gl.drawElements (gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    m.identity(mMatrix);
    m.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix);
    m.rotate (mMatrix, rad, [0, 0, 1], mMatrix);
    m.multiply(tmpMatrix, mMatrix, mvpMatrix);

    gl.bindTexture (gl.TEXTURE_2D, null);
    gl.enable (gl.BLEND);

    gl.uniformMatrix4fv (uniLocation[0], false, mvpMatrix);
    gl.uniform1f (uniLocation[1], vertexAlpha);
    gl.uniform1i (uniLocation[2], 0);
    gl.uniform1i (uniLocation[3], false);
    gl.drawElements (gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    gl.flush ();
    animation(render);

  })();
}
