const Vector = require('engine/Vector');
const CONST = require('../../../const');

/**
 * @class
 * @param points {PIXI.Vector[]|number[]|...PIXI.Vector|...number} This can be an array of Points that form the polygon,
 *      a flat array of numbers that will be interpreted as [x,y, x,y, ...], or the arguments passed can be
 *      all the points of the polygon e.g. `new PIXI.Polygon(new PIXI.Vector(), new PIXI.Vector(), ...)`, or the
 *      arguments passed can be flat x,y values e.g. `new Polygon(x,y, x,y, x,y, ...)` where `x` and `y` are
 *      Numbers.
 */
class Polygon {
  constructor(points_) {
    // prevents an argument assignment deopt
    // see section 3.1: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    var points = points_;

    // if points isn't an array, use arguments as the array
    if (!Array.isArray(points)) {
        // prevents an argument leak deopt
        // see section 3.2: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
      points = new Array(arguments.length);

      for (var a = 0; a < points.length; ++a) {
        points[a] = arguments[a];
      }
    }

    // if this is an array of points, convert it to a flat array of numbers
    if (points[0] instanceof Vector) {
      var p = [];
      for (var i = 0, il = points.length; i < il; i++) {
        p.push(points[i].x, points[i].y);
      }

      points = p;
    }

    this.closed = true;

    /**
     * An array of the points of this polygon
     *
     * @member {number[]}
     */
    this.points = points;

    /**
     * The type of the object, mainly used to avoid `instanceof` checks
     *
     * @member {number}
     */
    this.type = CONST.SHAPES.POLY;
  }

  /**
   * Creates a clone of this polygon
   *
   * @return {PIXI.Polygon} a copy of the polygon
   */
  clone() {
    return new Polygon(this.points.slice());
  }

  /**
   * Checks whether the x and y coordinates passed to this function are contained within this polygon
   *
   * @param x {number} The X coordinate of the point to test
   * @param y {number} The Y coordinate of the point to test
   * @return {boolean} Whether the x/y coordinates are within this polygon
   */
  contains(x, y) {
    var inside = false;

      // use some raycasting to test hits
      // https://github.com/substack/point-in-polygon/blob/master/index.js
    var length = this.points.length / 2;

    for (var i = 0, j = length - 1; i < length; j = i++) {
      var xi = this.points[i * 2], yi = this.points[i * 2 + 1],
        xj = this.points[j * 2], yj = this.points[j * 2 + 1],
        intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }
}

module.exports = Polygon;
