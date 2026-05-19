
const heroY = Math.round(height * 0.62);
const heroH = Math.round(height * 0.30);
const heroX = Math.round(width * 0.20);
const heroW = Math.round(width * 0.60);

const calcFS = Math.round(width * 0.024);
const heroFS = Math.round(width * 0.090);
const arrowFS = Math.round(width * 0.024);

const rowOp = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const heroSp = spring({frame: Math.max(0, frame-12), fps, config:{damping:8, stiffness:140}, durationInFrames: 14});
const heroScale = interpolate(heroSp, [0, 1], [1.4, 1.0]);
const heroOp = interpolate(frame, [12, 24], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const hlStart = 32;
const hlScale = interpolate(frame, [hlStart, hlStart+10], [0,1], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.quad)});

// Section wrapper — flex column with calc row on top + hero number below
return React.createElement('div', {
  style:{
    position:'absolute',
    left: heroX, top: heroY, width: heroW, height: heroH,
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap: 18
  }
},
  // Calc row (flex row of three sibling spans — no overlap by construction)
  React.createElement('div', {
    style:{
      display:'flex', alignItems:'center', justifyContent:'center', gap: 16,
      fontFamily: D.font_display, fontWeight: 900, fontSize: calcFS,
      opacity: rowOp
    }
  },
    React.createElement('span', { style:{ color: D.red } }, '$12,400'),
    React.createElement('span', { style:{ color: D.amber, fontSize: arrowFS } }, '→'),
    React.createElement('span', { style:{ color: D.green } }, '$3,100')
  ),
  // Hero number with highlighter rect — relative wrapper so highlighter is sibling
  React.createElement('div', {
    style:{
      position:'relative',
      opacity: heroOp,
      transform: 'scale(' + heroScale + ')',
      transformOrigin: 'center',
      paddingLeft: 12, paddingRight: 12
    }
  },
    // Highlighter — absolute INSIDE this relative wrapper. This is a single
    // "decorative overlay over a single text element"; allowed because there
    // are no sibling content elements to overlap with — only one child.
    React.createElement('div', {
      style:{
        position:'absolute', left: 0, right: 0, top: '15%', bottom: '15%',
        backgroundColor: D.amber, opacity: 0.4, borderRadius: 8,
        transformOrigin: 'left center',
        transform: 'scaleX(' + hlScale + ')',
        zIndex: 0
      }
    }),
    React.createElement('span', {
      style:{
        position:'relative', zIndex: 1,
        fontFamily: D.font_display, fontWeight: 900, fontSize: heroFS,
        color: D.amber, letterSpacing: -3
      }
    }, '−75%')
  )
);
