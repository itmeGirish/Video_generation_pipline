
const cardW = Math.round(width * 0.28);
const cardH = Math.round(height * 0.42);
const cardY = Math.round(height * 0.18);
const leftX_final = Math.round(width * 0.03);
const rightX_final = Math.round(width * 0.69);

// central gap: from (leftX_final + cardW) to rightX_final → ~38% W wide
const gapStart = leftX_final + cardW;
const gapEnd = rightX_final;
const gapCX = (gapStart + gapEnd) / 2;

const calcCY = Math.round(height * 0.28);
const heroCY = Math.round(height * 0.45);

const rowFS = Math.round(width * 0.024);
const heroFS = Math.round(width * 0.085);
const arrowFS = Math.round(width * 0.024);

const rowOp = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const heroSp = spring({frame: Math.max(0, frame-12), fps, config:{damping:8, stiffness:140}, durationInFrames: 14});
const heroScale = interpolate(heroSp, [0,1], [1.4, 1.0]);
const heroOp = interpolate(frame, [12, 24], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

const hlStart = 32;
const hlScale = interpolate(frame, [hlStart, hlStart+10], [0,1], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing: Easing.out(Easing.quad)});

return React.createElement('div', {style:{position:'absolute', inset:0}},
  // Calc row inside the central gap
  React.createElement('div', {
    style:{
      position:'absolute', left: gapStart, top: calcCY,
      width: gapEnd - gapStart,
      display:'flex', alignItems:'center', justifyContent:'center', gap: 16,
      fontFamily: D.font_display, fontWeight: 900, fontSize: rowFS,
      opacity: rowOp
    }
  },
    React.createElement('span', {style:{color: D.red}}, '$12,400'),
    React.createElement('span', {style:{color: D.amber, fontSize: arrowFS}}, '→'),
    React.createElement('span', {style:{color: D.green}}, '$3,100')
  ),
  // Hero −75% in the central gap
  React.createElement('div', {
    style:{
      position:'absolute', left: gapStart, top: heroCY,
      width: gapEnd - gapStart,
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity: heroOp,
      transform: 'scale(' + heroScale + ')',
      transformOrigin: 'center center'
    }
  },
    React.createElement('div', {style:{position:'relative', display:'inline-block', padding: '0 12px'}},
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
  )
);
