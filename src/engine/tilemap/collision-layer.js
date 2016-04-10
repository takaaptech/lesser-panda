var utils = require('./utils');
var utilsG = require('engine/utils');

function unique(arr) {
  var seen = {};
  var out = [];
  var len = arr.length;
  var j = 0;
  for (var i = 0; i < len; i++) {
    var item = arr[i];
    if (seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}

function pointInPolygon(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

/* p1 in p2 */
function polygonInPolygon(p1, p2) {
  var inside = true;
  var point = [0, 0];
  for (var i = 0; i < p1.length - 1; i += 2) {
    point[0] = p1[i];
    point[1] = p1[i + 1];
    if (!pointInPolygon(point, p2)) {
      inside = false;
      break;
    }
  }
  return inside;
}

function CollisionLayer(def) {
  this.tilesize = def.tilesize;
  this.width = def.width;
  this.height = def.height;
  this.data = utils.lift(def.data, this.width, this.height);

  this.generateShapes();
}
CollisionLayer.prototype.generateShapes = function generateShapes() {
  var i, j;

  // Create edges
  var edges = [];

  var mx = this.tilesize, my = this.tilesize;
  var x, y, v0, v1, v2, v3, grid = this.data;
  for (i = 0; i < this.height; i++) {
    for (j = 0; j < this.width; j++) {
      if (grid[i][j] !== 0) {
        x = mx * j; // left
        y = my * i; // top
        v0 = { x: x,      y: y + my }; // left-bottom
        v1 = { x: x,      y: y      }; // left-top
        v2 = { x: x + mx, y: y      }; // right-top
        v3 = { x: x + mx, y: y + my }; // right-bottom
        edges.push([v0, v1]);
        edges.push([v1, v2]);
        edges.push([v2, v3]);
        edges.push([v3, v0]);
      }
    }
  }
  console.log('[start]edges: ' + edges.length);

  function isEdgeEqual(e1, e2) {
    var d1 = (e1[0].x - e2[1].x)*(e1[0].x - e2[1].x) + (e1[0].y - e2[1].y)*(e1[0].y - e2[1].y);
    var d2 = (e2[0].x - e1[1].x)*(e2[0].x - e1[1].x) + (e2[0].y - e1[1].y)*(e2[0].y - e1[1].y);
    if (d1 < 0.25 && d2 < 0.25) return true;
  }

  // Go through all edges and delete all instances of the ones that appear more than once
  var e1, e2;
  for (i = edges.length - 1; i >= 0; i--) {
    e1 = edges[i];
    for (j = i - 1; j >= 0; j--) {
      e2 = edges[j];
      if (isEdgeEqual(e1, e2)) {
        utilsG.removeItems(edges, i, 1);
        utilsG.removeItems(edges, j, 1);
      }
    }
  }
  console.log('[remove duplicated edges]edges: ' + edges.length);

  function findEdge(edge_list, point) {
    for (var i = 0; i < edge_list.length; i++) {
      var edge = edge_list[i];
      var d = (edge[0].x - point.x)*(edge[0].x - point.x) + (edge[0].y - point.y)*(edge[0].y - point.y);
      if (d < 0.25) return i;
    }
    return -1;
  }

  // Remove extra edges
  var edge_list_size = edges.length, last_edge_list_size = 0;
  while (edge_list_size !== last_edge_list_size) {
    edge_list_size = edges.length;
    for (i = 0; i < edges.length; i++) {
      edge = edges[i];
      var p1 = edge[0];
      var p2 = edge[1];
      var p3Idx = findEdge(edges, edge[1]);
      var p3 = null;
      if (p3Idx >= 0) {
        p3 = edges[p3Idx][1];
        if (Math.abs((p1.y - p2.y)*(p1.x - p3.x) - (p1.y - p3.y)*(p1.x - p2.x)) < 0.025) {
          edge[1].x = p3.x;
          edge[1].y = p3.y;
          utilsG.removeItems(edges, p3Idx, 1);
          i -= 1;
          break;
        }
      }
    }
    last_edge_list_size = edges.length;
  }
  console.log('[simplify vertices]edges: ' + edges.length);

  // Tag groups
  function edgeTag(tag, edge) {
    edge.tag = tag;
    var next_edge = findEdge(edges, edge[1]);
    while ((next_edge >= 0) && (edges[next_edge].tag == undefined)) {
      edges[next_edge].tag = tag;
      next_edge = findEdge(edges, edges[next_edge][1]);
    }
  }

  var current_tag = 0;
  for (i = 0; i < edges.length; i++) {
    edge = edges[i];
    if (edge.tag == undefined) {
      edgeTag(current_tag, edge);
      current_tag += 1;
    }
  }

  function getTagShape(edges, tag) {
    var temp_edges = edges.filter(function(value) { return value.tag === tag });
    var vertices = [];
    var edge = temp_edges[0];
    utilsG.removeItems(temp_edges, 0, 1);
    vertices.push([edge[0].x, edge[0].y]);
    var next_edge = findEdge(temp_edges, edge[1]);
    while (next_edge >= 0) {
      edge = temp_edges[next_edge];
      utilsG.removeItems(temp_edges, next_edge, 1);
      vertices.push([edge[0].x, edge[0].y]);
      next_edge = findEdge(temp_edges, edge[1]);
    }
    if (temp_edges.length === 0) return vertices;
  }

  // Figure out which tags are holes
  var shapes = [];
  for (i = 0; i < current_tag; i++) {
    shapes.push(getTagShape(edges, i));
  }

  var hole_tags = [];
  for (i = 0; i < shapes.length; i++) {
    var s1 = shapes[i];
    for (j = 0; j < shapes.length; j++) {
      var s2 = shapes[j];
      if (i !== j) {
        if (polygonInPolygon(s2, s1)) {
          hole_tags.push(j);
        }
      }
    }
  }
  hole_tags = unique(hole_tags);
};

module.exports = exports = CollisionLayer;
