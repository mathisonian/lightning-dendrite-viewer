'use strict';

var LightningVisualization = require('lightning-visualization');
var _ = require('lodash');

var InitGL = require('gl-now');
var glslify = require('glslify');

var createShader = require('gl-shader');
var createTexture = require("gl-texture2d")
var createBuffer = require('gl-buffer');

var createOrbitCamera = require("orbit-camera")

var glm = require("gl-matrix")
var mat4 = glm.mat4

var ndarray = require('ndarray');

var imgW = 50;
var imgH = 50;

/*
 * Extend the base visualization object
 */
var Visualization = LightningVisualization.extend({

    getDefaultOptions: function() {
        return {
        };
    },

    init: function() {
         this.el.style.width = this.width + 'px';
         this.el.style.height = this.height + 'px';
         this.el.style.position = 'relative';

         this.images = _.map(_.range(60), function() {
           return {
             x: Math.random() * this.width,
             y: Math.random() * this.height,
             z: Math.random() * -100,
             width: Math.random() / 10 * this.width,
             height: Math.random() / 10 * this.height,
           }
         }, this);

        this.shell = InitGL({
          element: this.el,
          clearColor: [0, 0, 0, 1]
        });

        this.shell.on("gl-init", this.initGL.bind(this));
        this.shell.on("gl-render", this.renderGL.bind(this));
        this.shell.on("tick", this.tickGL.bind(this));
    },

    initGL: function() {
      var gl = this.shell.gl;

      gl.enable(gl.DEPTH_TEST);

      this.camera = createOrbitCamera([this.width / 2, this.height / 2, 500], [this.width / 2, this.height / 2, -10], [0,1,0])
      this.shader = createShader(gl, glslify('./shaders/vertex.glsl'), glslify('./shaders/fragment.glsl'));
      this.shader.bind();

      this.shader.uniforms.resolution = [this.shell.width, this.shell.height];

      this.positionBuffer = createBuffer(gl, this._getBufferRectangle(0, 0, 0, 0));
      this.positionBuffer.bind();
      this.shader.attributes.position.pointer();

      this.texturePositionBuffer = createBuffer(gl, this._getBufferRectangle(0, 0, 1, 1));
      this.texturePositionBuffer.bind();
      this.shader.attributes.texturePosition.pointer();

      this.texture = createTexture(gl, [imgW, imgH], gl.ALPHA, gl.FLOAT);
      this.texture.bind();
      this.shader.uniforms.texture = this.texture;

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    },

    renderGL: function() {
      var gl = this.shell.gl;

      var scratch = mat4.create()
      this.shader.uniforms.model = scratch
      this.shader.uniforms.projection = mat4.perspective(scratch, Math.PI/4.0, this.shell.width / this.shell.height, 0.1, 1000.0)
      this.shader.uniforms.view = this.camera.view(scratch)

      this.renderImages();
    },

    tickGL: function() {
      var shell = this.shell;
      var gl = shell.gl;
      var camera = this.camera;
      if(shell.wasDown("mouse-left")) {
        camera.rotate([shell.mouseX/shell.width-0.5, shell.mouseY/shell.height-0.5],
                      [shell.prevMouseX/shell.width-0.5, shell.prevMouseY/shell.height-0.5])
      }
      if(shell.wasDown("mouse-right")) {
        camera.pan([2*(shell.mouseX-shell.prevMouseX)/shell.width,
                    2*(shell.mouseY - shell.prevMouseY)/shell.height])
      }
      if(shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.1)
      }

    },

    renderImages: function() {

     var gl = this.shell.gl;
     var self = this;
     var imPosition, imSize;

     this.images.map(function(imageObj) {

       self.texture.setPixels(ndarray(new Float32Array(_.map(_.range(imgW * imgH), function() { return Math.random(); })), [imgW, imgH]));

       imPosition = [imageObj.x, imageObj.y, imageObj.z];
       imSize = [imageObj.width, imageObj.height];

       self.positionBuffer.update(self._getBufferRectangle3D(imPosition[0], imPosition[1], imPosition[2], imSize[0], imSize[1]));

       gl.drawArrays(gl.TRIANGLES, 0, 6);

     });
    },

    _getBufferRectangle: function(x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      return [
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2
      ];
    },
    _getBufferRectangle3D: function(x, y, z, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      return [
       x1, y1, z,
       x2, y1, z,
       x1, y2, z,
       x1, y2, z,
       x2, y1, z,
       x2, y2, z
      ];
    },

    formatData: function(data) {
        /*
         * Format your data from a raw JSON blob
         */
        return data;
    },

    updateData: function(formattedData) {
        this.data = formattedData;
        /*
         * FILL IN Re-render your visualization
         */
    },

    appendData: function(formattedData) {
        /*
         * FILL IN Update this.data to include the newly formatted data
         */

        /*
         * FILL IN Re-render the visualization
         */
    }

});


module.exports = Visualization;
