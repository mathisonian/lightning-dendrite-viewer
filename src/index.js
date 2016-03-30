'use strict';

var LightningVisualization = require('lightning-visualization');
var _ = require('lodash');

var InitGL = require('gl-now');
var glslify = require('glslify');

var createShader = require('gl-shader');
var createTexture = require('gl-texture2d');
var createBuffer = require('gl-buffer');

var createOrbitCamera = require('orbit-camera');

var glm = require('gl-matrix');
var mat4 = glm.mat4;

var ndarray = require('ndarray');

var bonzo = require('bonzo');

/*
 * Extend the base visualization object
 */
var Visualization = LightningVisualization.extend({

    getDefaultOptions: function() {
        return {
        };
    },

    onImageLoaded: function(callback) {

      return function() {
        this.loadedImages += 1;
        bonzo(this.qwery('#image-count'))
          .text(this.loadedImages);

        if (this.loadedImages === this.images.length) {
          this.imagesLoaded = true;

          bonzo(this.qwery('.loading-container'))
            .remove();

          var self = this;

          callback();

          setInterval(function() {
              self.currentTimestamp = (self.currentTimestamp + 1) % self.numTimepoints;
          }, 1000 / 30);
        }
      }
    },

    loadImages: function(callback) {
      this.images = this.images.map(function(url) {
          var img = new Image();
          img.src = url;
          img.onload = this.onImageLoaded(callback).bind(this);
          img.crossOrigin = 'anonymous';
          return img;
      }, this);
    },

    getImageAtTime: function(i, t) {
      return this.images[i * this.numTimepoints + t];
    },

    init: function() {

      this.loadedImages = 0;
      this.currentTimestamp = 0;
      this.numTimepoints = this.images.length / this.data.offsets.length;

      bonzo(this.qwery(this.el))
        .append('<span style="margin-left: 100px; margin-top: 100px; display: inline-block" class="loading-container">Loaded <span id="image-count">0</span>/' + this.images.length + ' images.</span>"');

      this.loadImages((function() {
        this.shell = InitGL({
          element: this.el,
          clearColor: [0, 0, 0, 1]
        });

        this.shell.on('gl-init', this.initGL.bind(this));
        this.shell.on('gl-render', this.renderGL.bind(this));
        this.shell.on('tick', this.tickGL.bind(this));
      }).bind(this));
      this.el.style.position = 'relative';

    },

    initGL: function() {
      var gl = this.shell.gl;

      gl.disable(gl.DEPTH_TEST);

      this.camera = createOrbitCamera([187.44075656132247, 130.72967482804205, -30], [187.44075656132247, 130.72967482804205, 14], [0,1,0])

      var vertex = `attribute vec3 position;
        uniform mat4 model;
        uniform mat4 view;
        uniform mat4 projection;

        attribute vec2 texturePosition;
        varying vec2 texCoord;

        void main() {
          gl_Position = projection * view * model * vec4(position, 1);
          texCoord = texturePosition;
        }
        `

      var fragment = `precision highp float;
        uniform sampler2D texture;
        varying vec2 texCoord;
        void main() {

          vec4 c = texture2D(texture, texCoord);

          // if (c.r < 0.01) {
          //   c.a = 0.0;
          // }

          gl_FragColor = c;
        }
        `

      this.shader = createShader(gl, vertex, fragment);
      this.shader.bind();

      this.shader.uniforms.resolution = [this.shell.width, this.shell.height];

      this.positionBuffer = createBuffer(gl, this._getBufferRectangle(0, 0, 0, 0));
      this.positionBuffer.bind();
      this.shader.attributes.position.pointer();

      this.texturePositionBuffer = createBuffer(gl, this._getBufferRectangle(0, 0, 1, 1));
      this.texturePositionBuffer.bind();
      this.shader.attributes.texturePosition.pointer();

      this.texture = createTexture(gl, this.data.windowDimensions, gl.LUMINANCE);

      this.texture.bind();
      this.shader.uniforms.texture = this.texture;

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
      var width = gl.drawingBufferWidth
      var height = gl.drawingBufferHeight
      gl.viewport(0, 0, width, height);
      if(shell.wasDown('mouse-left')) {
        camera.rotate([shell.mouseX/shell.width-0.5, shell.mouseY/shell.height-0.5],
                      [shell.prevMouseX/shell.width-0.5, shell.prevMouseY/shell.height-0.5])
      }
      if(shell.wasDown('mouse-right')) {
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
     var imPosition;
     var imSize = this.data.windowDimensions;

     _.range(this.data.offsets.length).map(function(i) {
       this.texture.setPixels(this.getImageAtTime(i, this.currentTimestamp));
       imPosition = this.data.offsets[i];
       this.positionBuffer.update(this._getBufferRectangle3D(imPosition[0], imPosition[1], imPosition[2] - 140, imSize[0], imSize[1]));
       gl.drawArrays(gl.TRIANGLES, 0, 6);
     }, this);

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
