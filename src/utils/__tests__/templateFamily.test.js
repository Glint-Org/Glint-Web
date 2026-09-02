import { describe, expect, it } from 'vitest';
import { mergeTemplateFamily, templateJsonUrl } from '../templateFamily.js';

const common = {
  familyId: 'blink',
  name: 'Blink',
  palette: [{ id: 'primary', label: 'Primary', color: '#611AB4' }],
  style: {
    fontFamily: 'Montserrat',
    fontWeight: '800',
    lineHeight: 1.14,
    shadow: { color: 'rgba(0,0,0,0.25)', blur: 5, offsetX: 8, offsetY: 8 },
  },
  device: { position: 'top', minCoverage: 0.5 },
  preview: { bg: '#611AB4', headlines: ['BLINK'] },
  slides: [
    {
      name: 'Hero',
      layers: [
        { role: 'bg', type: 'background', color: '#FFFFFF' },
        {
          role: 'title',
          type: 'headline',
          position: 'top',
          placeholder: 'BLINK',
          color: '#611AB4',
          shadow: true,
        },
        { role: 'device', type: 'device', slot: 0 },
      ],
    },
  ],
};

const play = {
  id: 'blink-play',
  extends: 'common',
  store: 'play/phone',
  canvas: { width: 1080, height: 1920 },
  device: { frame: 'pixel9', widthFraction: 0.86 },
  preview: { frame: 'pixel9' },
  layout: {
    Hero: {
      title: { fontSize: 196, marginTop: 168 },
      device: { marginTop: 640 },
    },
  },
};

describe('templateFamily', () => {
  it('maps family ids to folder paths', () => {
    expect(templateJsonUrl('blink-play')).toBe('/templates/blink/play.json');
    expect(templateJsonUrl('glint-gold-ipad')).toBe('/templates/glint-gold/ipad.json');
    expect(templateJsonUrl('warm-glow-play')).toBe('/templates/warm-glow/play.json');
    expect(templateJsonUrl('ios-clean')).toBe('/templates/ios-clean.json');
  });

  it('merges common style/copy with platform layout', () => {
    const t = mergeTemplateFamily(common, play);
    expect(t.id).toBe('blink-play');
    expect(t.familyId).toBe('blink');
    expect(t.palette[0].color).toBe('#611AB4');
    expect(t.canvas).toEqual({ width: 1080, height: 1920 });
    expect(t.preview.frame).toBe('pixel9');

    const hero = t.slides[0];
    expect(hero.id).toBe('blink-play-f1');
    const title = hero.layers.find((l) => l.role === 'title');
    expect(title.placeholder).toBe('BLINK');
    expect(title.fontFamily).toBe('Montserrat');
    expect(title.fontSize).toBe(196);
    expect(title.marginTop).toBe(168);
    expect(title.shadow.blur).toBe(5);

    const device = hero.layers.find((l) => l.role === 'device');
    expect(device.frame).toBe('pixel9');
    expect(device.widthFraction).toBe(0.86);
    expect(device.marginTop).toBe(640);
    expect(device.position).toBe('top');
  });
});
