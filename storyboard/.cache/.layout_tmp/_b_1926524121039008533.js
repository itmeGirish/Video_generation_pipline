const NARRATION_TEXT = "<pause 0.2s> Turn it up and you'd expect better answers. <pause 0.3s> But when researchers tested GPT-5 last February, turning it to high actually lowered accuracy \u2014 and cost fifty-six percent more.";

const w = width, h = height;
const cardW = Math.round(w * 0.27);
const gap = Math.round(w * 0.03);
const startX = Math.round((w - (cardW * 3 + gap * 2)) / 2);
const cardTop = Math.round(h * 0.18);
const cardH = Math.round(h * 0.62);
const barsTop = cardTop + cardH + Math.round(h * 0.02);
const maxBarH = Math.round(h * 0.13);

const bars = [
  {col: D.green, pct: 0.10, val: '$0.25', label: 'LOW'},
  {col: D.amber, pct: 0.34, val: '$0.35', label: 'MEDIUM'},
  {col: D.red,   pct: 0.88, val: '$0.39', label: 'HIGH'},
];

const barEls = bars.map(function(b, i) {
  const sp = spring({frame: frame - i * 8, fps, config:{damping:12, stiffness:90, mass:2}});
  const barH = Math.round(maxBarH * b.pct * sp);
  const centerX = startX + i * (cardW + gap) + Math.round(cardW / 2);
  const barW = Math.round(cardW * 0.50);
  return React.createElement('div', {
    key: b.label,
    style: {
      position: 'absolute',
      left: centerX - Math.round(barW / 2),
      top: barsTop + maxBarH - barH,
      width: barW,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }
  },
    React.createElement('div', {style:{
      color: b.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.009),
      fontWeight: '700', marginBottom: 4
    }}, b.val),
    React.createElement('div', {style:{
      width: '100%', height: barH, backgroundColor: b.col, borderRadius: '3px 3px 0 0'
    }})
  );
});

const sp56 = spring({frame: frame - 28, fps, config:{damping:8}});
const highX = startX + 2 * (cardW + gap) + Math.round(cardW / 2);
const labelEl = React.createElement('div', {style:{
  position: 'absolute',
  left: highX - Math.round(cardW * 0.48),
  top: barsTop - Math.round(h * 0.08),
  width: Math.round(cardW * 0.96),
  textAlign: 'center',
  color: D.red,
  fontFamily: D.font_mono,
  fontSize: Math.round(w * 0.014),
  fontWeight: '700',
  opacity: sp56,
  transform: 'scale(' + (0.4 + 0.6 * sp56) + ')',
}}, 'COST +56%');

return barEls.concat([labelEl]);
