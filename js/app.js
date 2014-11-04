var app = (function(w){

  // make singleton instance.
  var _instance;

  function App () {
    var c, gl;
    this.init = function(clearColor){
      c = document.getElementById('canvas');
      c.width = 500;
      c.height = 300;

      gl = c.getContext('webgl') || c.getContext ('experimental-webgl');
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.clear (gl.COLOR_BUFFER_BIT);

    }
  }


  // return singleton class.
  if ( _instance != undefined ) {
    return _instance;
  } else {
    _instance = new App ();
    return _instance;
  }

})(window);

window.onload = function(){

  // set clear color RGBA
  var clearColorArray = [0.0, 0.0, 0.0, 1.0];

  console.log ("initializing application...");
  console.log (clearColorArray[0]);
  app.init(clearColorArray);
}
