var app = (function(){

  // make singleton instance.
  var _instance;

  function App () {

    // #pragma region - variables
    var c, // canvas
        gl, // webgl context
        vs, // vertex shader
        fs; // fragment shader

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
    }

    // #pragma region - public methods
    this.init = function(w, h, clearColor, depth){
      c = document.getElementById('canvas');
      c.width = w;
      c.height = h;

      gl = c.getContext('webgl') || c.getContext ('experimental-webgl');
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clearDepth (depth);
      gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    this.clearContext = function (clearColor, depth) {
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clearDepth (depth);
      gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

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
    }

    this.getContext = function () {
      return gl;
    }

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
    }

    this.createVBO = function (data) {
      var vbo = gl.createBuffer ();

      // bind buffer
      gl.bindBuffer (gl.ARRAY_BUFFER, vbo);

      // set data in buffer
      gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (data), gl.STATIC_DRAW);

      // unbind buffer
      gl.bindBuffer (gl.ARRAY_BUFFER, null);

      return vbo;
    }

    this.createIBO = function (data) {
      var ibo = gl.createBuffer ();

      gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
      gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, null);

      return ibo;
    }

    this.setShaderAttrib = function (vbo, attL, attS) {

      for (var i in vbo) {
        gl.bindBuffer (gl.ARRAY_BUFFER, vbo[i]);
        gl.enableVertexAttribArray (attL[i]);
        gl.vertexAttribPointer (attL[i], attS[i], gl.FLOAT, false, 0, 0);
      }

    }

    this.createTorus = function (row, column, irad, orad) {
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
          pos.push (tx, ty, tz);
          nor.push (rx, ry, rz);
          var tc = _hsva (360 / column * ii, 1, 1, 1);
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
      return [pos, nor, col, idx];
    }
  }


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

  app.init(300, 300, clearColorArray, 1.0);
  var c = app.getCanvas ();
  var gl = app.getContext ();
  var vShader = app.createShader ('vertexShader');
  var fShader = app.createShader ('fragmentShader');
  var prg = app.createProgram (vShader, fShader);


  var torusData = app.createTorus (32, 32, 1.0, 2.0);
  var position = torusData[0];
  var normal = torusData[1]
  var color = torusData[2];
  var index = torusData[3];

  // create VBO
  var vbos = new Array (3);
  vbos[0] = app.createVBO (position);
  vbos[1] = app.createVBO (color);
  vbos[2] = app.createVBO (normal);

  var attLocation = new Array (3);
  attLocation[0] = gl.getAttribLocation (prg, 'position');
  attLocation[1] = gl.getAttribLocation (prg, 'color');
  attLocation[2] = gl.getAttribLocation (prg, 'normal');

  var attStride = new Array (2);
  attStride[0] = 3;
  attStride[1] = 4;
  attStride[2] = 3;
  app.setShaderAttrib (vbos, attLocation, attStride);

  // create IBO
  var ibo = app.createIBO (index);
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, ibo);

  gl.enable (gl.CULL_FACE);
  gl.enable (gl.DEPTH_TEST);
  gl.depthFunc (gl.LEQUAL);
  // create mat4 lib instance
  var m = new matIV ();

  // initialize matrixes
  var mMatrix = m.identity (m.create ());
  var vMatrix = m.identity (m.create ());
  var pMatrix = m.identity (m.create ());
  var tmpMatrix = m.identity (m.create ());
  var mvpMatrix = m.identity (m.create ());
  var invMatrix = m.identity(m.create());

  m.lookAt ([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix);
  m.perspective (45, c.width / c.height, 0.1, 100, pMatrix);
  m.multiply (pMatrix, vMatrix, tmpMatrix);
  m.inverse (mMatrix, invMatrix);

  var lightDirection = [-0.5, 0.5, 0.5];

  var uniLocation = [];
  uniLocation[0] = gl.getUniformLocation (prg, 'mvpMatrix');
  uniLocation[1] = gl.getUniformLocation (prg, 'invMatrix');
  uniLocation[2] = gl.getUniformLocation (prg, 'lightDirection');

  var count = 0;

  var animation = (function (w, r) {
    return w['r'+r] = w['r'+r] || w['webkitR'+r] || w['mozR'+r] || w['msR'+r] || w['oR'+r] || function(c){ w.setTimeout(c, 1000 / 60); };
  })(window, 'equestAnimationFrame');

  (function render () {

    app.clearContext(clearColorArray, 1.0);
    count++;
    var rad = (count % 360) * Math.PI / 180;

    m.identity (mMatrix);
    m.rotate (mMatrix, rad, [1, 0, 1], mMatrix);
    m.multiply (tmpMatrix, mMatrix, mvpMatrix);
    m.inverse (mMatrix, invMatrix);

    gl.uniformMatrix4fv (uniLocation[0], false, mvpMatrix);
    gl.uniformMatrix4fv (uniLocation[1], false, invMatrix);
    gl.uniform3fv (uniLocation[2], lightDirection);

    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

    gl.flush ();
    animation(render);
  })();
}
