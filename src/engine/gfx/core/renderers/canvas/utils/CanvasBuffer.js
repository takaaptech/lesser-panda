/**
 * Creates a Canvas element of the given size.
 *
 * @class
 * @param width {number} the width for the newly created canvas
 * @param height {number} the height for the newly created canvas
 */
class CanvasBuffer {
  constructor(width, height) {
    /**
     * The Canvas object that belongs to this CanvasBuffer.
     *
     * @member {HTMLCanvasElement}
     */
    this.canvas = document.createElement('canvas');

    /**
     * A CanvasRenderingContext2D object representing a two-dimensional rendering context.
     *
     * @member {CanvasRenderingContext2D}
     */
    this.context = this.canvas.getContext('2d');

    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Clears the canvas that was created by the CanvasBuffer class.
   *
   * @private
   */
  clear() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
  }

  /**
   * Resizes the canvas to the specified width and height.
   *
   * @param width {number} the new width of the canvas
   * @param height {number} the new height of the canvas
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Destroys this canvas.
   *
   */
  destroy() {
    this.context = null;
    this.canvas = null;
  }
}

Object.defineProperties(CanvasBuffer.prototype, {
    /**
     * The width of the canvas buffer in pixels.
     *
     * @member {number}
     * @memberof PIXI.CanvasBuffer#
     */
  width: {
    get: function() {
      return this.canvas.width;
    },
    set: function(val) {
      this.canvas.width = val;
    },
  },
    /**
     * The height of the canvas buffer in pixels.
     *
     * @member {number}
     * @memberof PIXI.CanvasBuffer#
     */
  height: {
    get: function() {
      return this.canvas.height;
    },
    set: function(val) {
      this.canvas.height = val;
    },
  },
});

module.exports = CanvasBuffer;
