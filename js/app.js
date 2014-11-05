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

    this.setShaderAttrib = function (vbo, attL, attS) {

      for (var i in vbo) {
        gl.bindBuffer (gl.ARRAY_BUFFER, vbo[i]);
        gl.enableVertexAttribArray (attL[i]);
        gl.vertexAttribPointer (attL[i], attS[i], gl.FLOAT, false, 0, 0);
      }

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

  var attLocation = new Array (2);
  attLocation[0] = gl.getAttribLocation (prg, 'position');
  attLocation[1] = gl.getAttribLocation (prg, 'color');
  var uniLocation = gl.getUniformLocation (prg, 'mvpMatrix');

  var attStride = new Array (3);
  attStride[0] = 3;
  attStride[1] = 4;

  var vertexPosition = [
    0.0, 1.0, 0.0,
    1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0
  ];

  var vertexColor = [
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0
  ];

  var vbos = new Array (2);
  vbos[0] = app.createVBO (vertexPosition);
  vbos[1] = app.createVBO (vertexColor);

  app.setShaderAttrib (vbos, attLocation, attStride);

  // create mat4 lib instance
  var m = new matIV ();

  // initialize matrixes
  var mMatrix = m.identity (m.create ());
  var vMatrix = m.identity (m.create ());
  var pMatrix = m.identity (m.create ());
  var tmpMatrix = m.identity (m.create ());
  var mvpMatrix = m.identity (m.create ());

  m.lookAt ([0.0, 1.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
  m.perspective (90, c.width / c.height, 0.1, 100, pMatrix);
  m.multiply (pMatrix, vMatrix, tmpMatrix);
  m.translate (mMatrix, [1.5, 0.0, 0.0], mMatrix);
  m.multiply (tmpMatrix, mMatrix, mvpMatrix);

  gl.uniformMatrix4fv (uniLocation, false, mvpMatrix);
  gl.drawArrays (gl.TRIANGLES, 0, 3);

  m.identity (mMatrix);
  m.translate (mMatrix, [-1.5, 0.0, 0.0], mMatrix);
  m.multiply (tmpMatrix, mMatrix, mvpMatrix);

  gl.uniformMatrix4fv (uniLocation, false, mvpMatrix);
  gl.drawArrays (gl.TRIANGLES, 0, 3);

  var count = 0;

  var animation = (function (w, r) {
    return w['r'+r] = w['r'+r] || w['webkitR'+r] || w['mozR'+r] || w['msR'+r] || w['oR'+r] || function(c){ w.setTimeout(c, 1000 / 60); };
  })(window, 'equestAnimationFrame');

  (function render () {
    app.init(300, 300, clearColorArray, 1.0);
    count++;
    var rad = (count % 360) * Math.PI / 180;

    var x = Math.cos (rad);
    var y = Math.sin (rad);
    m.identity (mMatrix);
    m.translate (mMatrix, [x, y + 1.0, 0.0], mMatrix);

    m.multiply (tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv (uniLocation, false, mvpMatrix);
    gl.drawArrays (gl.TRIANGLES, 0, 3);

    m.identity (mMatrix);
    m.translate (mMatrix, [1.0, -1.0, 0.0], mMatrix);
    m.rotate (mMatrix, rad, [0, 1, 0], mMatrix);

    m.multiply (tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv (uniLocation, false, mvpMatrix);
    gl.drawArrays (gl.TRIANGLES, 0, 3);

    var s = Math.sin (rad) + 1.0;
    m.identity (mMatrix);
    m.translate (mMatrix, [-1.0, -1.0, 0.0], mMatrix);
    m.scale(mMatrix, [s, s, 0.0], mMatrix);

    m.multiply (tmpMatrix, mMatrix, mvpMatrix);
    gl.uniformMatrix4fv (uniLocation, false, mvpMatrix);
    gl.drawArrays (gl.TRIANGLES, 0, 3);

    gl.flush ();
    animation(render);
  })();

}
