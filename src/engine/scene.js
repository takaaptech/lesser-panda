var EventEmitter = require('engine/eventemitter3');
var engine = require('engine/core');
var utils = require('engine/utils');
var config = require('game/config');

/**
  Game scene.
  @class Scene
**/
function Scene() {
  EventEmitter.call(this);

  /**
    Desired FPS this scene should run
    @attribute {Number} desiredFPS
    @default 30
  **/
  this.desiredFPS = config.desiredFPS || 30;

  /**
    @property {Array} updateOrder
    @private
  **/
  this.updateOrder = [];

  var i, name, sys;
  for (i in Scene.updateOrder) {
    name = Scene.updateOrder[i];
    sys = Scene.systems[name];

    if (sys) {
      this.updateOrder.push(name);
      sys.init && sys.init(this);
    }
  }
}

Scene.prototype = Object.create(EventEmitter.prototype);
Scene.prototype.constructor = Scene;

/**
 * Called before activating this scene
 */
Scene.prototype._awake = function _awake() {
  for (var i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys.awake && sys.awake(this);
  }

  this.emit('awake');
  this.awake();
};

/**
 * Called each single frame once or more
 */
Scene.prototype._update = function _update(delta) {
  var i;

  // Pre-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.preUpdate && sys.preUpdate(this, delta);
  }

  this.emit('preUpdate', delta);
  this.preUpdate(delta);

  // Update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.update && sys.update(this, delta);
  }

  this.emit('update', delta);
  this.update(delta);

  // Post-update
  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.postUpdate && sys.postUpdate(this, delta);
  }

  this.emit('postUpdate', delta);
  this.postUpdate(delta);
};

/**
 * Called before deactivating this scene
 */
Scene.prototype._freeze = function _freeze() {
  this.emit('freeze');
  this.freeze();

  for (i in this.updateOrder) {
    sys = Scene.systems[this.updateOrder[i]];
    sys && sys.freeze && sys.freeze(this);
  }
};

Scene.prototype.awake = function awake() {};
Scene.prototype.preUpdate = function preUpdate() {};
Scene.prototype.update = function update() {};
Scene.prototype.postUpdate = function postUpdate() {};
Scene.prototype.freeze = function freeze() {};

Scene.prototype.pause = function pause() {};
Scene.prototype.resume = function resume() {};

Object.assign(Scene, {
  desiredFPS: config.desiredFPS || 30,

  systems: {},
  /**
   * System updating order
   * @attribute {Array} updateOrder
   */
  updateOrder: [
    'Object',
    'Timeline',
    'Physics',
    'Renderer',
  ],
  registerSystem: function registerSystem(name, system) {
    if (Scene.systems[name]) throw 'System [' + name + '] is already defined!';

    Scene.systems[name] = system;
  },
});

// Object system --------------------------------------------
Object.assign(Scene.prototype, {
  /**
   * Add object to scene, so it's `update()` function get's called every frame.
   * @method addObject
   * @param {Object} object Object you want to add
   * @param {String} tag    Tag of this object, default is '0'
   */
  addObject: function addObject(object, tag) {
    var t = tag || '0';

    if (this.objects.indexOf(object) === -1) {
      object._remove = false;
      if (!this.objects[t]) {
        // Create a new object list
        this.objects[t] = [];

        // Active by default
        this.activeTags.push(t);
      }
      this.objects[t].push(object);
    }
  },

  /**
   * Remove object from scene.
   * @method removeObject
   * @param {Object} object
   */
  removeObject: function removeObject(object) {
    object._remove = true;
  },

  pauseObjects: function pauseObjects(tag) {
    if (this.objects[tag]) {
      utils.removeItems(this.objects.activeTags, this.objects.activeTags.indexOf(tag), 1);
      this.objects.deactiveTags.push(tag);
    }

    return this;
  },

  resumeObjects: function pauseObjects(tag) {
    if (this.objects[tag]) {
      utils.removeItems(this.objects.deactiveTags, this.objects.deactiveTags.indexOf(tag), 1);
      this.objects.activeTags.push(tag);
    }

    return this;
  },
});

Scene.registerSystem('Object', {
  init: function init(scene) {
    /**
     * Map of object lists.
     * @property {Object} objects
     */
    scene.objects = {
      activeTags: ['0'],
      deactiveTags: [],

      '0': [],
    };
  },
  update: function update(scene, dt) {
    var i, key, objects;
    for (key in scene.objects) {
      if (scene.objects.activeTags.indexOf(key) < 0) continue;

      objects = scene.objects[key];
      for (i = 0; i < objects.length; i++) {
        if (!objects[i]._remove) {
          objects[i].update(dt);
        }
        if (objects[i]._remove) {
          utils.removeItems(objects, i, 1);
        }
      }
    }
  },
});

module.exports = Scene;
