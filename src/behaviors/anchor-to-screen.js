/**
 * Anchor object to screen left/right/top/bottom,
 * by percentage or pixel.
 *
 * Note: Set both `right` and `left` will stretch the width of target.
 */

import engine from 'engine/core';
import Behavior from 'engine/behavior';

function pct2Num(pctStr) {
  if (pctStr.length === 0) return 0;
  if (pctStr[pctStr.length - 1] !== '%') return 0;

  return parseFloat(pctStr.slice(0, -1)) * 0.01;
}

export default class AnchorToScreen extends Behavior {
  static TYPE = 'AnchorToScreen';

  static DEFAULT_SETTINGS = {
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined,
  };

  awake() {
    this.calc('left');
    this.calc('right');
    this.calc('top');
    this.calc('bottom');
  }
  update() {
    this.applyAnchor();
  }
  applyAnchor() {
    const bounds = this.actor.sprite.getLocalBounds();

    let left, right, top, bottom, width, height;

    // x-axis
    if (this.left !== undefined) {
      // this.actor.position.x = this.left + bounds.x;
      left = this.left;
    }
    else if (this.leftPct !== undefined) {
      // this.actor.position.x = engine.width * this.leftPct - bounds.x;
      left = engine.width * this.leftPct;
    }
    if (this.right !== undefined) {
      // this.actor.position.x = engine.width - this.right - (bounds.x + bounds.width);
      right = engine.width - this.right;
    }
    else if (this.rightPct !== undefined) {
      // this.actor.position.x = engine.width * (1 - this.rightPct) - (bounds.x + bounds.width);
      right = engine.width * (1 - this.rightPct);
    }
    // Stretch if both left and right is set
    if (left !== undefined && right !== undefined) {
      width = right - left;
    }

    if (width !== undefined) {
      this.actor.sprite.width = width;
    }
    if (left !== undefined) {
      this.actor.position.x = left - bounds.x;
    }
    else if (right !== undefined) {
      this.actor.position.x = right - (bounds.x + bounds.width);
    }

    // y-axis
    if (this.top !== undefined) {
      // this.actor.position.y = this.top + bounds.y;
      top = this.top;
    }
    else if (this.topPct !== undefined) {
      // this.actor.position.y = engine.height * this.topPct - bounds.y;
      top = engine.height * this.topPct;
    }
    if (this.bottom !== undefined) {
      // this.actor.position.y = engine.height - this.bottom - (bounds.y + bounds.height);
      bottom = engine.height - this.bottom;
    }
    else if (this.bottomPct !== undefined) {
      // this.actor.position.y = engine.height * (1 - this.bottomPct) - (bounds.y + bounds.height);
      bottom = engine.height * (1 - this.bottomPct);
    }
    // Stretch if both top and bottom is set
    if (top !== undefined && bottom !== undefined) {
      height = bottom - top;
    }

    if (height !== undefined) {
      this.actor.sprite.height = height;
    }
    if (top !== undefined) {
      this.actor.position.y = top - bounds.y;
    }
    else if (bottom !== undefined) {
      this.actor.position.y = bottom - (bounds.y + bounds.height);
    }
  }

  calc(dir) {
    if (typeof(this[dir]) === 'string') {
      this[`${dir}Pct`] = pct2Num(this[dir]);
      this[dir] = undefined;
    }
  }
}

Behavior.register('AnchorToScreen', AnchorToScreen);
