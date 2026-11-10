/** Draws a sprite to a canvas at a whole number scale. Decorative, so hidden from screen readers. */
import { useEffect, useRef } from 'preact/hooks';
import { slotRgb } from '../palette';
import type { Sprite } from './sprite';

interface Props {
  sprite: Sprite;
  scale?: number;
  class?: string;
}

export function SpriteCanvas({ sprite, scale = 3, class: className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(sprite.w, sprite.h);
    sprite.pixels.forEach((slot, i) => {
      if (slot === null) return;
      const [r, g, b] = slotRgb(slot);
      img.data.set([r, g, b, 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
  }, [sprite]);
  return (
    <canvas
      ref={ref}
      class={`hs-sprite${className ? ` ${className}` : ''}`}
      width={sprite.w}
      height={sprite.h}
      style={{ width: `${sprite.w * scale}px`, height: `${sprite.h * scale}px` }}
      aria-hidden="true"
    />
  );
}
