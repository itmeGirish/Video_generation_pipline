const NARRATION_TEXT = "<pause 0.2s> Turn it up and you'd expect better answers. <pause 0.3s> But when researchers tested GPT-5 last February, turning it to high actually lowered accuracy \u2014 and cost fifty-six percent more.";

const w = width, h = height;
const barBottom = Math.round(h * 0.80);
const maxBarH = Math.round(h * 0.55);
const barW = Math.round(w * 0.16);
const barCXs = [Math.round(w * 0.27), Math.round(w * 0.50), Math.round(w * 0.73)];
const bars = [
  {col: D.green, pct: 0.16, val: '$0.25', label: 'LOW'},
  {col: D.amber, pct: 0.55, val: '$0.35', label: 'MEDIUM'},
  {col: D.red,   pct: 1.00, val: '$0.39', label: 'HIGH'},
];

const titleEl = React.createElement('div', {style:{
  position:'absolute', left:0, top:Math.round(h*0.08), width:w, textAlign:'center',
  color:D.text_dim, fontFamily:D.font_mono, fontSize:Math.round(w*0.011), fontWeight:'700'
}}, 'COST BY EFFORT LEVEL');

const barEls = bars.map(function(b, i) {
  const sp = spring({frame: frame - i * 8, fps, config:{damping:12, stiffness:90, mass:2}});
  const barH = Math.round(maxBarH * b.pct * sp);
  return React.createElement(React.Fragment, {key: b.label},
    React.createElement('div', {style:{
      position:'absolute',
      left: barCXs[i] - Math.round(barW / 2),
      top: barBottom - barH,
      width: barW, height: barH,
      backgroundColor: b.col,
      borderRadius: '4px 4px 0 0',
    }}),
    React.createElement('div', {style:{
      position:'absolute',
      left: barCXs[i] - Math.round(barW * 0.7),
      top: barBottom - barH - Math.round(h * 0.065),
      width: Math.round(barW * 1.4), textAlign:'center',
      color: b.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.011),
      fontWeight: '700', opacity: sp,
    }}, b.val),
    React.createElement('div', {style:{
      position:'absolute',
      left: barCXs[i] - Math.round(barW * 0.55),
      top: barBottom + Math.round(h * 0.022),
      width: Math.round(barW * 1.1), textAlign:'center',
      color: b.col, fontFamily: D.font_mono, fontSize: Math.round(w * 0.010),
    }}, b.label)
  );
});

const baseline = React.createElement('div', {style:{
  position:'absolute', left:Math.round(w*0.12), top:barBottom,
  width:Math.round(w*0.76), height:2, backgroundColor:D.text_dim,
}});

const sp56 = spring({frame: frame - 28, fps, config:{damping:8}});
const stamp = React.createElement('div', {style:{
  position:'absolute',
  left: barCXs[2] - Math.round(barW * 0.9),
  top: barBottom - maxBarH - Math.round(h * 0.10),
  width: Math.round(barW * 1.8), textAlign:'center',
  color: D.red, fontFamily: D.font_mono, fontSize: Math.round(w * 0.016),
  fontWeight: '700', opacity: sp56,
  transform: 'scale(' + (0.4 + 0.6 * sp56) + ')',
}}, 'COST +56%');

return [titleEl, baseline].concat(barEls).concat([stamp]);
