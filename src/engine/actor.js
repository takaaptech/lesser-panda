var EventEmitter = require('engine/eventemitter3');
var Vector = require('engine/vector');
var PIXI = require('engine/pixi');
var physics = require('engine/physics');
var Behavior = require('engine/behavior');

var DEFAULT_POLYGON_VERTICES = [
  Vector.create(-4, -4),
  Vector.create( 4, -4),
  Vector.create( 4,  4),
  Vector.create(-4,  4),
];

/**
 * Base object that may contain a PIXI.Container instance(as `sprite`)
 * and a physics.Body instance(as `body`).
 *
 * The `sprite` and `body` share the same postion and rotation,
 * designed to be easy to use.
 *
 * You can both inherit and use chained method calls to create
 * a custom {@link Actor}.
 *
 * @example <caption>Custom Actor by inherit</caption>
 * class MyActor extends Actor {
 *   construct() {
 *     super();
 *
 *     // Initialize 'sprite' as a Graphics instance
 *     this.initGraphics({ shape: 'Box', width: 10, height: 10, color: 0xffffff })
 *       // Initialize physics 'body', and it will automatically setup itself
 *       // based on the 'sprite'.
 *       .initBody();
 *   }
 * }
 *
 * @example <caption>Custom Actor by chaining</caption>
 * // Spawn an Actor instance
 * scene.spawnActor(Actor, 0, 0, 'stage')
 *   // Init the 'sprite' as a PIXI.Container instance
 *   .initEmpty()
 *     // Add a graphics to 'sprite', save ref to it as 'sprBody'
 *     .addGraphics({ shape: 'Circle', width: 10, height: 10, color: 0xffffff }, 'sprite', 'sprBody')
 *     // Add a sprite to 'sprite', save ref to it as 'sprArm'
 *     .addSprite(my_texture, 'sprite', 'sprArm');
 *
 * @class Actor
 * @extends {EventEmitter}
 *
 * @constructor
 * @param {string} name   Name of this actor
 */
function Actor(name) {
  EventEmitter.call(this);

  /**
   * @type {number}
   */
  this.id = Actor.uid++;

  /**
   * Name of this Actor, can be undefined
   * @type {string}
   */
  this.name = name;

  /**
   * Tag for updating
   * @type {string}
   */
  this.tag = null;

  /**
   * Whether this actor is removed from scene
   * @type {boolean}
   * @private
   */
  this.removed = false;

  /**
   * Want this actor to be updated?
   * @type {boolean}
   * @default false
   */
  this.canEverTick = false;

  /**
   * Component for visual display, can be any sub-classes of `PIXI.Cotnainer` or null
   * @type {PIXI.Container}
   * @default null
   */
  this.sprite = null;

  /**
   * Component for physics simulation and collision detection or null.
   * @type {module:engine/physics.Body}
   * @default null
   */
  this.body = null;

  /**
   * Position
   * @type {Vector}
   * @default (0, 0)
   */
  this.position = Vector.create();

  /**
   * Reference to the scene that actor is added to
   * @type {Scene}
   * @default null
   */
  this.scene = null;
  /**
   * Reference to the container that `sprite` is added to
   * @type {PIXI.Container}
   * @default null
   */
  this.layer = null;

  /**
   * Behavior list
   * @type {array}
   */
  this.behaviorList = [];

  /**
   * Type-behavior map
   * @type {object}
   */
  this.behaviors = {};

  /**
   * Rotation cache
   * @type {number}
   * @private
   */
  this._rotation = 0;
}
Actor.prototype = Object.create(EventEmitter.prototype);
Actor.prototype.constructor = Actor;

Actor.uid = 0;

/**
 * Rotation
 * @member {number}
 * @memberof Actor#
 */
Object.defineProperty(Actor.prototype, 'rotation', {
  get: function() {
    return this._rotation;
  },
  set: function(val) {
    this._rotation = val;

    if (this.sprite) {
      this.sprite.rotation = this._rotation;
    }
    if (this.body) {
      this.body.rotation = this._rotation;
    }
  },
});

/**
 * Add to the scene and a container
 * @method addTo
 * @memberof Actor#
 * @param {Scene} scene
 * @param {PIXI.Container} layer
 * @return {Actor} Actor itself for chaining
 */
Actor.prototype.addTo = function addTo(scene, layer) {
  this.scene = scene;
  this.layer = layer;

  if (this.sprite) {
    this.layer.addChild(this.sprite);
  }
  if (this.body) {
    this.scene.world.addBody(this.body);
  }

  this.prepare();

  return this;
};

/**
 * Will be called by `addTo` method after the Actor components are
 * properly added.
 * @method prepare
 * @memberof Actor#
 */
Actor.prototype.prepare = function prepare() {};

/**
 * Update method to be called each frame
 * Nothing inside, no need to call `super.update`
 * @method update
 * @memberof Actor#
 * @protected
 */
Actor.prototype.update = function update(dtMS, dtSec) {};

/**
 * Remove from current scene and layer container
 * @method remove
 * @memberof Actor#
 */
Actor.prototype.remove = function remove() {
  this.removed = true;

  if (this.sprite) {
    this.sprite.remove();
  }
  if (this.body) {
    this.body.remove();
  }

  this.scene = null;
  this.layer = null;
};

// Component factory methods

/**
 * Initialize `sprite` as an empty visual node(PIXI.Container).
 * @method initEmpty
 * @memberof Actor#
 * @return {Actor}        self for chaining
 */
Actor.prototype.initEmpty = function initEmpty() {
  this.addEmpty(null, 'sprite');
  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};
/**
 * Add an empty visual node instance(PIXI.Container).
 * @method addEmpty
 * @memberof Actor#
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining
 */
Actor.prototype.addEmpty = function addEmpty(parentNode, key) {
  // Create instance
  var inst = new PIXI.Container();

  // Add the instance to the parent
  if (parentNode && this[parentNode] && (parentNode !== key)) {
    this[parentNode].addChild(inst);
  }

  // Assign as a property if required
  if (key) {
    this[key] = inst;
  }

  return this;
};

/**
 * Initialize `sprite` as Sprite.
 * @method initSprite
 * @memberof Actor#
 * @param  {PIXI.Texture} texture
 * @return {Actor}        self for chaining
 */
Actor.prototype.initSprite = function initSprite(texture) {
  this.addSprite(texture, null, 'sprite');
  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};
/**
 * Add a sprite instance.
 * @method addSprite
 * @memberof Actor#
 * @param {PIXI.Texture} texture
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining
 */
Actor.prototype.addSprite = function addSprite(texture, parentNode, key) {
  // Create instance
  var inst = new PIXI.Sprite(texture);
  inst.anchor.set(0.5);

  // Add the instance to the parent
  if (parentNode && this[parentNode] && (parentNode !== key)) {
    this[parentNode].addChild(inst);
  }

  // Assign as a property if required
  if (key) {
    this[key] = inst;
  }

  return this;
};

/**
 * Initialize `sprite` as Graphics.
 * @method initGraphics
 * @memberof Actor#
 * @param {object} [settings]   See {@link Actor#initGraphics} for details.
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining
 * @return {Actor}  self for chaining
 */
Actor.prototype.initGraphics = function initGraphics(settings, parentNode, key) {
  this.addGraphics(settings, null, 'sprite');
  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};
/**
 * Add a graphics instance.
 * @method addGraphics
 * @memberof Actor#
 * @param {object} [settings]
 * @param [settings.shape] {string} default 'Box'
 * @param [settings.width] {number} default 8, for 'Box' shapes
 * @param [settings.height] {number} default 8, for 'Box' shapes
 * @param [settings.radius] {number} default 8, for 'Circle' shapes
 * @param [settings.points] {array<engine/vector>} vertices for 'Polygon' shapes
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining
 */
Actor.prototype.addGraphics = function addGraphics(settings, parentNode, key) {
  // Create instance
  var settings_ = settings || {};

  var inst = new PIXI.Graphics();
  inst.beginFill(settings_.color || 0x000000);
  var shape = settings_.shape || 'Box';
  if (shape === 'Circle') {
    inst.drawCircle(0, 0, settings_.radius || 8);
  }
  else if (shape === 'Box') {
    var w = settings_.width || 8;
    var h = settings_.height || 8;
    inst.drawRect(-w * 0.5, -h * 0.5, w, h);
  }
  else if (shape === 'Polygon') {
    var points = settings_.points || DEFAULT_POLYGON_VERTICES;
    inst.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      inst.lineTo(points[i].x, points[i].y);
    }
  }
  inst.endFill();

  // Add the instance to the parent
  if (parentNode && this[parentNode] && (parentNode !== key)) {
    this[parentNode].addChild(inst);
  }

  // Assign as a property if required
  if (key) {
    this[key] = inst;
  }

  return this;
};

/**
 * Initialize `sprite` as AnimatedSprite
 * @method initAnimatedSprite
 * @memberof Actor#
 * @param settings {object}
 * @param settings.textures {array<PIXI.Texture>}
 * @param settings.anims {array<{ name, frames, settings }>}
 * @return {Actor}  self for chaining
 */
Actor.prototype.initAnimatedSprite = function initAnimatedSprite(settings_) {
  this.addAnimatedSprite(settings, null, 'sprite');
  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};
/**
 * Add an animated sprite instance.
 * @method addAnimatedSprite
 * @memberof Actor#
 * @param settings {object}
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining
 */
Actor.prototype.addAnimatedSprite = function addAnimatedSprite(settings, parentNode, key) {
  // Create instance
  var settings_ = settings || {};

  var inst = new PIXI.extras.AnimatedSprite(settings_.textures);
  inst.anchor.set(0.5);

  var anims = settings_.anims;
  if (Array.isArray(anims)) {
    for (var i = 0; i < anims.length; i++) {
      this.sprite.addAnim(anims[i].name, anims[i].frames, anims[i].settings);
    }
  }

  // Add the instance to the parent
  if (parentNode && this[parentNode] && (parentNode !== key)) {
    this[parentNode].addChild(inst);
  }

  // Assign as a property if required
  if (key) {
    this[key] = inst;
  }

  return this;
};

/**
 * Initialize `sprite` as Text.
 * @method initText
 * @memberof Actor#
 * @param  {object} settings  Text settings.
 * @return {Actor}            Self for chaining.
 */
Actor.prototype.initText = function initText(settings) {
  this.addText(settings, null, 'sprite');
  this.sprite.position = this.position;

  if (this.layer) {
    this.layer.addChild(this.sprite);
  }

  return this;
};
/**
 * Add a text instance.
 * @method addText
 * @memberof Actor#
 * @param {object} settings
 * @param {string} [settings.text] Content of this text.
 * @param {string} [parentNode] Which visual node to add to, default is 'sprite'.
 * @param {string} [key]        Which key to assign to. (make it a property of this Actor)
 * @return {Actor}              Self for chaining.
 */
Actor.prototype.addText = function addText(settings, parentNode, key) {
  // Create instance
  var inst = new PIXI.Text(settings.text, settings, settings.resolution || 1);

  // Add the instance to the parent
  if (parentNode && this[parentNode] && (parentNode !== key)) {
    this[parentNode].addChild(inst);
  }

  // Assign as a property if required
  if (key) {
    this[key] = inst;
  }

  return this;
};

/**
 * Initialize `body`
 * @method initBody
 * @memberof Actor#
 * @param  {object} settings
 * @param  [settings.shape] {string} default 'Box'
 * @param  [settings.width] {number} default 8, for 'Box' shapes
 * @param  [settings.height] {number} default 8, for 'Box' shapes
 * @param  [settings.radius] {number} default 8, for 'Circle' shapes
 * @param  [settings.points] {array<engine/vector>} vertices for 'Polygon' shapes
 * @return {Actor}  self for chaining
 */
Actor.prototype.initBody = function initBody(settings_) {
  var settings = settings_ || {};

  // Create shape
  var shapeInst, shape = settings.shape || 'Box';
  if (shape === 'Circle') {
    var r = settings.radius;
    if (!Number.isFinite(r)) {
      if (this.sprite) {
        r = this.sprite.width / 2;
      }
    }
    shape = new physics.Circle(r);
  }
  else if (shape === 'Box') {
    var w = settings.width, h = settings.height;
    if (!Number.isFinite(w)) {
      if (this.sprite) {
        w = this.sprite.width;
        h = this.sprite.height;
      }
      else {
        w = h = 8;
      }
    }
    else {
      if (!Number.isFinite(h)) {
        h = w;
      }
    }

    shape = new physics.Box(w, h);
  }
  else if (shape === 'Polygon') {
    shape = new physics.Polygon(settings.points || DEFAULT_POLYGON_VERTICES);
  }

  // Cleanup settings
  var bodySettings = Object.assign({}, settings);
  delete bodySettings.shape;
  delete bodySettings.radius;
  delete bodySettings.width;
  delete bodySettings.height;
  delete bodySettings.points;
  bodySettings.shape = shape;

  // Create body
  this.body = new physics.Body(bodySettings);
  this.body.position = this.position;

  this.body.parent = this;

  if (this.scene) {
    this.scene.world.addBody(this.body);
  }

  return this;
};

/**
 * Add a behavior to this Actor.
 * Note: the same behavior can only be added ONCE.
 * @method behave
 * @memberof Actor#
 * @param {string|Behavior|object}  behavior  Behavior type or constructor or instance
 * @param {object}                  settings  Settings for this behavior
 * @return {Actor} Self for chaining
 */
Actor.prototype.behave = function behave(behv, settings) {
  var behavior = behv;
  if (typeof(behv) === 'string') {
    behavior = Behavior.behaviors[behv];
  }

  // Create instance if the behavior is a function(constructor)
  if (typeof(behavior) === 'function') {
    behavior = new behavior();
  }

  if (this.behaviors[behavior.type]) {
    console.log('An instance of behavior "' + behavior.type + '" is already added!');
    return this;
  }

  this.behaviorList.push(behavior);
  this.behaviors[behavior.type] = behavior;

  // Setup
  behavior.addTo(this);
  behavior.setup(settings || {});

  return this;
};

/**
 * Get a behavior instance by its type
 * @method getBehaviorByType
 * @memberof Actor#
 * @param  {string} type  Type of the behavior to be activated
 * @return {Behavior}     Behavior of the type, return undefined no one exists.
 */
Actor.prototype.getBehaviorByType = function getBehaviorByType(type) {
  return this.behaviors[type];
};

/**
 * Activate a behavior by its type
 * @method activateBehavior
 * @memberof Actor#
 * @param  {string} type  Type of the behavior to be activated
 * @return {Actor}        Self for chaining
 */
Actor.prototype.activateBehavior = function activateBehavior(type) {
  var behv = this.behaviors[type];
  if (behv) {
    behv.activate();
  }

  return this;
};

/**
 * De-activate a behavior by its type
 * @method deactivateBehavior
 * @memberof Actor#
 * @param  {string} type  Type of the behavior to be de-activated
 * @return {Actor}        Self for chaining
 */
Actor.prototype.deactivateBehavior = function deactivateBehavior(type) {
  var behv = this.behaviors[type];
  if (behv) {
    behv.deactivate();
  }

  return this;
};

/**
 * Update behaviorList, automatically called by Actor sub-system
 * @method updateBehaviors
 * @memberof Actor#
 * @private
 * @param  {number} dtMS  Delta time in milli-seconds
 * @param  {number} dtSec Delta time in seconds
 */
Actor.prototype.updateBehaviors = function updateBehaviors(dtMS, dtSec) {
  var i, behv;
  for (i = 0; i < this.behaviorList.length; i++) {
    behv = this.behaviorList[i];
    behv.update && behv.update(dtMS, dtSec);
  }
};

/**
 * Actor is the core object of Lesser Panda, which provides lots of
 * benefits such as Behavior support, config based initialise.
 *
 * @exports engine/actor
 * @see Actor
 *
 * @requires module:engine/eventemitter3
 * @requires module:engine/vector
 * @requires module:engine/pixi
 * @requires module:engine/physics
 * @requires module:engine/behavior
 */
module.exports = Actor;
