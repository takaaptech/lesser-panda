/**
 * Let the actor always face to the mouse
 */

import renderer from 'engine/renderer';
import Behavior from 'engine/behavior';

export default class FaceTheMouse extends Behavior {
  static TYPE = 'FaceTheMouse';

  constructor() {
    super();
    this.mousePos = renderer.instance.plugins.interaction.mouse.global;
    this.posCache = this.mousePos.clone();
  }
  update(_, dt) {
    this.actor.rotation = this.posCache.copy(this.mousePos)
      .subtract(this.actor.position)
      .angle();
  }
}

Behavior.register('FaceTheMouse', FaceTheMouse);
