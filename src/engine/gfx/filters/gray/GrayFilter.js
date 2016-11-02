var core = require('../../core');


/**
 * This greyscales the palette of your Display Objects.
 *
 * @class
 * @extends PIXI.AbstractFilter
 * @memberof PIXI.filters
 */
function GrayFilter() {
  core.AbstractFilter.call(this,
        // vertex shader
        null,
        // fragment shader
        require('./gray.frag'),
        // set the uniforms
    {
      gray: { type: '1f', value: 1 },
    }
    );
}

GrayFilter.prototype = Object.create(core.AbstractFilter.prototype);
GrayFilter.prototype.constructor = GrayFilter;
module.exports = GrayFilter;

Object.defineProperties(GrayFilter.prototype, {
    /**
     * The strength of the gray. 1 will make the object black and white, 0 will make the object its normal color.
     *
     * @member {number}
     * @memberof PIXI.filters.GrayFilter#
     */
  gray: {
    get: function() {
      return this.uniforms.gray.value;
    },
    set: function(value) {
      this.uniforms.gray.value = value;
    },
  },
});
