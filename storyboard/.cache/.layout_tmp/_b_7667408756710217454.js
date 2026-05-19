
const cardW = Math.round(width * 0.28);
const cardH = Math.round(height * 0.42);
const cardY = Math.round(height * 0.18);
const leftX_final = Math.round(width * 0.03);
const rightX_final = Math.round(width * 0.69);

const leftSp = spring({frame, fps, config:{damping:14, mass:0.8}, durationInFrames: 30});
const leftX = interpolate(leftSp, [0,1], [-cardW - 80, leftX_final]);
const rightSp = spring({frame: Math.max(0, frame-15), fps, config:{damping:14, mass:0.8}, durationInFrames: 30});
const rightX = interpolate(rightSp, [0,1], [width + 80, rightX_final]);

const lineFS = Math.round(width * 0.011);
const titleFS = Math.round(width * 0.018);
const subFS = Math.round(width * 0.009);
const totalFS = Math.round(width * 0.018);
const heroFS = Math.round(width * 0.034);
const headerFS = Math.round(width * 0.010);
const stampFS = Math.round(width * 0.018);

function makeRow(label, value, opacity){
  return React.createElement('div', {
    key: label,
    style: {
      display:'flex', justifyContent:'space-between', alignItems:'center',
      fontFamily: D.font_mono, fontSize: lineFS, color: D.text_dim,
      marginBottom: 8, opacity
    }
  },
    React.createElement('span', null, label),
    React.createElement('span', null, value)
  );
}

function makeCard(opts){
  const {x, headerColor, headerText, subtitle, items, totalValue, totalColor, stampText, stampColor, stampRot} = opts;
  const rowOp = interpolate(frame, [20, 40], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const stampOp = interpolate(frame, [40, 55], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  return React.createElement('div', {
    style:{
      position:'absolute', left: x, top: cardY, width: cardW, height: cardH,
      backgroundColor: D.surface_hi, borderRadius: 12,
      border: '3px solid ' + headerColor,
      boxSizing:'border-box', overflow:'hidden',
      boxShadow: '0 0 60px ' + D.bg
    }
  },
    React.createElement('div', {
      style:{
        height: 50, backgroundColor: headerColor,
        display:'flex', alignItems:'center', paddingLeft: 14,
        fontFamily: D.font_mono, fontSize: headerFS, color: D.white,
        letterSpacing: 1.5, fontWeight: 700
      }
    }, headerText),
    React.createElement('div', { style:{ padding: 20 } },
      React.createElement('div', {
        style:{ fontFamily: D.font_display, fontSize: titleFS, color: D.text, fontWeight: 900, letterSpacing: -0.5 }
      }, 'MONTHLY AI BILL'),
      React.createElement('div', {
        style:{ fontFamily: D.font_mono, fontSize: subFS, color: D.text_dim, marginTop: 4 }
      }, subtitle),
      React.createElement('div', { style:{ marginTop: 14 } }, items.map(it => makeRow(it.label, it.value, rowOp))),
      React.createElement('div', {
        style:{ height: 1, backgroundColor: D.border_dim, marginTop: 8, marginBottom: 8, opacity: rowOp }
      }),
      React.createElement('div', {
        style:{
          display:'flex', justifyContent:'space-between', alignItems:'baseline',
          opacity: rowOp, position:'relative'
        }
      },
        React.createElement('span', {
          style:{ fontFamily: D.font_display, fontSize: totalFS, fontWeight: 900, color: D.white }
        }, 'TOTAL'),
        React.createElement('span', {
          style:{ fontFamily: D.font_display, fontSize: heroFS, fontWeight: 900, color: totalColor }
        }, totalValue),
        React.createElement('div', {
          style:{
            position:'absolute', top: -10, right: -8,
            transform: 'rotate(' + stampRot + 'deg)', opacity: stampOp,
            border: '3px solid ' + stampColor, color: stampColor,
            fontFamily: D.font_display, fontWeight: 900, fontSize: stampFS,
            padding: '3px 10px', letterSpacing: 2, backgroundColor: 'transparent',
            pointerEvents: 'none'
          }
        }, stampText)
      )
    )
  );
}

const left = makeCard({
  x: leftX, headerColor: D.red, headerText: 'INVOICE #2026-04',
  subtitle: '(one-model strategy)',
  items: [
    {label:'GPT for drafts', value:'$4,200'},
    {label:'GPT for verification', value:'$3,800'},
    {label:'GPT for agents', value:'$2,900'},
    {label:'GPT for summaries', value:'$1,500'},
  ],
  totalValue: '$12,400', totalColor: D.red,
  stampText: 'OVERPAYING', stampColor: D.red, stampRot: -15,
});
const right = makeCard({
  x: rightX, headerColor: D.green, headerText: 'INVOICE #2026-04 (OPTIMIZED)',
  subtitle: '(routing layer)',
  items: [
    {label:'Routed drafts', value:'$1,100'},
    {label:'Pipeline verification', value:'$  780'},
    {label:'Agent tasks (GPT)', value:'$  720'},
    {label:'Summaries (GPT-mini)', value:'$  500'},
  ],
  totalValue: '$3,100', totalColor: D.green,
  stampText: 'OPTIMIZED', stampColor: D.green, stampRot: 15,
});

return React.createElement('div', {style:{position:'absolute', inset:0}}, left, right);
