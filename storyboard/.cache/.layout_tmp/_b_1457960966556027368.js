
const cardW = Math.round(width * 0.30);
const cardH = Math.round(height * 0.42);
const cardY = Math.round(height * 0.18);
const leftX = Math.round(width * 0.04);
const rightX = Math.round(width * 0.66);

const leftSp = spring({frame, fps, config:{damping:14, mass:0.8}, durationInFrames: 30});
const leftXAnim = interpolate(leftSp, [0, 1], [-cardW - 80, leftX]);
const rightSp = spring({frame: Math.max(0, frame - 15), fps, config:{damping:14, mass:0.8}, durationInFrames: 30});
const rightXAnim = interpolate(rightSp, [0, 1], [width + 80, rightX]);

const headerFS = Math.round(width * 0.010);
const titleFS = Math.round(width * 0.020);
const subFS = Math.round(width * 0.009);
const lineFS = Math.round(width * 0.011);
const totalLabelFS = Math.round(width * 0.018);
const totalNumFS = Math.round(width * 0.030);
const stampFS = Math.round(width * 0.010);

const rowOp = interpolate(frame, [20, 40], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const stampOp = interpolate(frame, [40, 55], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

function lineRow(label, value){
  return React.createElement('div', {
    key: label,
    style:{
      display:'flex', justifyContent:'space-between', alignItems:'baseline',
      fontFamily: D.font_mono, fontSize: lineFS, color: D.text_dim,
      marginBottom: 6
    }
  },
    React.createElement('span', null, label),
    React.createElement('span', null, value)
  );
}

function makeCard(opts){
  const { x, headerColor, headerText, subtitle, items, totalValue, totalColor, stampText, stampColor, stampRot } = opts;
  return React.createElement('div', {
    style:{
      position:'absolute', left: x, top: cardY,
      width: cardW, height: cardH,
      backgroundColor: D.surface_hi,
      borderRadius: 12,
      border: '3px solid ' + headerColor,
      boxSizing: 'border-box',
      overflow: 'hidden',
      // Inside-card layout via grid: header / body
      display: 'grid',
      gridTemplateRows: '50px 1fr',
      boxShadow: '0 0 60px ' + D.bg
    }
  },
    // Header bar (track 1)
    React.createElement('div', {
      style:{
        backgroundColor: headerColor,
        display:'flex', alignItems:'center',
        paddingLeft: 14,
        fontFamily: D.font_mono, fontSize: headerFS, color: D.white,
        letterSpacing: 1.5, fontWeight: 700
      }
    }, headerText),
    // Body (track 2): grid rows for title/subtitle/items/divider/total-row
    React.createElement('div', {
      style:{
        padding: 18,
        display: 'grid',
        gridTemplateRows: 'auto auto 1fr auto auto',
        rowGap: 6
      }
    },
      // Title
      React.createElement('div', {
        style:{
          fontFamily: D.font_display, fontWeight: 900, fontSize: titleFS,
          color: D.text, letterSpacing: -0.5
        }
      }, 'MONTHLY AI BILL'),
      // Subtitle
      React.createElement('div', {
        style:{
          fontFamily: D.font_mono, fontSize: subFS, color: D.text_dim
        }
      }, subtitle),
      // Items column (flex column, opacity ramps in)
      React.createElement('div', {
        style:{ display:'flex', flexDirection:'column', justifyContent:'flex-end', opacity: rowOp }
      }, items.map(it => lineRow(it.label, it.value))),
      // Divider
      React.createElement('div', {
        style:{ height: 1, backgroundColor: D.border_dim, opacity: rowOp }
      }),
      // Total row — flex with stamp as a sibling track (NEVER absolute)
      React.createElement('div', {
        style:{ display:'flex', alignItems:'baseline', gap: 12, opacity: rowOp }
      },
        React.createElement('span', {
          style:{ fontFamily: D.font_display, fontWeight: 900, fontSize: totalLabelFS, color: D.white }
        }, 'TOTAL'),
        React.createElement('span', {
          style:{ fontFamily: D.font_display, fontWeight: 900, fontSize: totalNumFS, color: totalColor, marginLeft: 'auto' }
        }, totalValue),
        // Stamp — its own flex track, transform tilts it visually only.
        // Cannot overlap totalValue because flex assigned each its own track.
        React.createElement('span', {
          style:{
            border: '2px solid ' + stampColor, color: stampColor,
            fontFamily: D.font_display, fontWeight: 900, fontSize: stampFS,
            padding: '2px 6px', letterSpacing: 1.5,
            transform: 'rotate(' + stampRot + 'deg)',
            transformOrigin: 'center',
            opacity: stampOp,
            whiteSpace: 'nowrap'
          }
        }, stampText)
      )
    )
  );
}

const left = makeCard({
  x: leftXAnim, headerColor: D.red, headerText: 'INVOICE #2026-04',
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
  x: rightXAnim, headerColor: D.green, headerText: 'INVOICE #2026-04 (OPTIMIZED)',
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
