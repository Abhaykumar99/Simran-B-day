/* ==========================================================================
   Lightweight canvas particle engine — ambient dust, opening scene,
   candle smoke, finale heart-formation + fireworks.
   No external deps, tuned to stay smooth on mobile.
   ========================================================================== */
(function(){
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 860px)').matches || 'ontouchstart' in window;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function rand(a,b){ return a + Math.random()*(b-a); }

  function resizeCanvas(canvas){
    var rect = canvas.parentElement === document.body ? { width: window.innerWidth, height: window.innerHeight } : canvas.getBoundingClientRect();
    var newW = Math.max(1, Math.floor(rect.width * DPR));
    var newH = Math.max(1, Math.floor(rect.height * DPR));
    
    // Prevent clearing the canvas on mobile if only the height changes (e.g. URL bar scrolling)
    if (isMobile && canvas.width === newW && canvas.height > 1) {
      canvas.style.height = rect.height + 'px';
      return { w: rect.width, h: rect.height };
    }
    
    canvas.width = newW;
    canvas.height = newH;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    return { w: rect.width, h: rect.height };
  }

  /* ---------------- Ambient background dust (whole page) ---------------- */
  function AmbientField(canvas){
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    var count = isMobile ? 26 : 60;
    var pts = [];
    for(var i=0;i<count;i++){
      pts.push({
        x: rand(0, dims.w), y: rand(0, dims.h),
        r: rand(.5, 1.8), vy: rand(-.06,-.02), vx: rand(-.04,.04),
        a: rand(.15,.55), tw: rand(0, Math.PI*2)
      });
    }
    var mouse = { x: dims.w/2, y: dims.h/2 };
    
    // Heart/Star trail logic
    var touchPts = [];
    function addTouch(x,y){
      var count = isMobile ? 1 : 4;
      for(var i=0;i<count;i++){
        var randType = Math.random();
        var pType = 'dot';
        if (randType > 0.7) pType = 'heart';
        else if (randType > 0.4) pType = 'sparkle';
        
        touchPts.push({
          x: x + rand(-15,15), y: y + rand(-15,15),
          vx: rand(-1.2, 1.2), vy: rand(-3.5, -0.5),
          r: pType === 'heart' ? rand(1.5, 4.5) : rand(1.5, 3.5), 
          a: 1, life: 1,
          rot: rand(0, Math.PI*2),
          vRot: rand(-0.08, 0.08),
          type: pType,
          color: pType === 'heart' ? 'rgba(255, 182, 193, ' : (pType === 'sparkle' ? 'rgba(255, 255, 255, ' : 'rgba(255, 219, 163, ')
        });
      }
    }

    var lastX = mouse.x, lastY = mouse.y;
    window.addEventListener('mousemove', function(e){ 
      mouse.x = e.clientX; mouse.y = e.clientY; 
      var dist = Math.abs(mouse.x - lastX) + Math.abs(mouse.y - lastY);
      if(dist > 10) {
        addTouch(mouse.x, mouse.y);
        lastX = mouse.x; lastY = mouse.y;
      }
    }, { passive:true });

    window.addEventListener('touchmove', function(e){
      var t = e.touches[0];
      if(t) {
        var dist = Math.abs(t.clientX - lastX) + Math.abs(t.clientY - lastY);
        // Larger distance threshold on mobile to prevent excessive spawning on fast scroll
        if(dist > (isMobile ? 30 : 10)) {
          addTouch(t.clientX, t.clientY);
          lastX = t.clientX; lastY = t.clientY;
        }
      }
    }, { passive:true });

    // Double tap/click logic for heart burst
    function burstHearts(x,y){
      var count = isMobile ? 30 : 60;
      for(var i=0;i<count;i++){
        var randType = Math.random();
        var pType = 'dot';
        if (randType > 0.6) pType = 'heart';
        else if (randType > 0.3) pType = 'sparkle';
        
        var angle = rand(0, Math.PI*2);
        var speed = rand(2, 9);
        touchPts.push({
          x: x, y: y,
          vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 1, // slight upward bias
          r: pType === 'heart' ? rand(2, 6) : rand(1.5, 4), 
          a: 1, life: 1,
          rot: rand(0, Math.PI*2),
          vRot: rand(-0.15, 0.15),
          type: pType,
          color: pType === 'heart' ? 'rgba(255, 182, 193, ' : (pType === 'sparkle' ? 'rgba(255, 255, 255, ' : 'rgba(255, 219, 163, ')
        });
      }
    }

    window.addEventListener('dblclick', function(e){
      burstHearts(e.clientX, e.clientY);
    });

    var lastTapTime = 0;
    window.addEventListener('touchstart', function(e){
      var now = Date.now();
      if(now - lastTapTime < 300 && e.touches.length > 0){
        burstHearts(e.touches[0].clientX, e.touches[0].clientY);
      }
      lastTapTime = now;
    }, { passive: true });

    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); });

    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save(); ctx.scale(DPR,DPR);
      
      // Draw background dust
      for(var i=0;i<pts.length;i++){
        var p = pts[i];
        p.x += p.vx; p.y += p.vy; p.tw += 0.02;
        var dx = mouse.x - p.x, dy = mouse.y - p.y;
        var dist = Math.sqrt(dx*dx+dy*dy);
        if(dist < 140){ p.x -= dx/dist*0.4; p.y -= dy/dist*0.4; }
        if(p.y < -10) p.y = dims.h + 10;
        if(p.x < -10) p.x = dims.w + 10;
        if(p.x > dims.w+10) p.x = -10;
        var alpha = p.a * (0.6 + 0.4*Math.sin(p.tw));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(240,178,92,'+alpha+')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }

      // Draw interactive trails (Hearts, Sparkles & Stars)
      for(var j=touchPts.length-1; j>=0; j--){
        var tp = touchPts[j];
        tp.x += tp.vx; tp.y += tp.vy;
        tp.rot += tp.vRot;
        tp.life -= 0.015;
        if(tp.life <= 0){ touchPts.splice(j,1); continue; }
        
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.rotate(tp.rot);
        ctx.scale(tp.r, tp.r);
        var alpha2 = tp.a * tp.life;
        
        ctx.shadowBlur = isMobile ? 0 : 15;
        
        if (tp.type === 'heart') {
          ctx.shadowColor = 'rgba(255,182,193,0.8)';
          ctx.fillStyle = tp.color + alpha2 + ')';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(0, -1.5, -2.5, -1.5, -2.5, 0.5);
          ctx.bezierCurveTo(-2.5, 2.5, 0, 4, 0, 5.5);
          ctx.bezierCurveTo(0, 4, 2.5, 2.5, 2.5, 0.5);
          ctx.bezierCurveTo(2.5, -1.5, 0, -1.5, 0, 0);
          ctx.fill();
        } else if (tp.type === 'sparkle') {
          ctx.shadowColor = 'rgba(255,255,255,0.8)';
          ctx.fillStyle = tp.color + alpha2 + ')';
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.quadraticCurveTo(0, 0, 2, 0);
          ctx.quadraticCurveTo(0, 0, 0, 2);
          ctx.quadraticCurveTo(0, 0, -2, 0);
          ctx.quadraticCurveTo(0, 0, 0, -2);
          ctx.fill();
        } else {
          ctx.shadowColor = 'rgba(255,219,163,0.8)';
          ctx.fillStyle = tp.color + alpha2 + ')';
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
      if(!reduced) requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------------- Opening scene: converging embers ---------------- */
  function OpenField(canvas){
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    var count = isMobile ? 40 : 90;
    var pts = [];
    for(var i=0;i<count;i++){
      pts.push({
        x: rand(0, dims.w), y: rand(0, dims.h),
        r: rand(.6, 2.2), vx: rand(-.15,.15), vy: rand(-.25,-.05),
        a: rand(.2,.7)
      });
    }
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); });

    var touchPts = [];
    function addTouch(x,y){
      for(var i=0;i<6;i++){
        touchPts.push({ x:x, y:y, vx: rand(-1,1), vy: rand(-1.4,-.2), r: rand(1,2.4), a:1, life:1 });
      }
    }
    canvas.addEventListener('touchstart', function(e){
      var t = e.touches[0]; if(t) addTouch(t.clientX, t.clientY);
    }, { passive:true });
    canvas.addEventListener('mousemove', function(e){
      if(Math.random() > 0.75) addTouch(e.clientX, e.clientY);
    });

    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save(); ctx.scale(DPR,DPR);
      for(var i=0;i<pts.length;i++){
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if(p.y < -10){ p.y = dims.h+10; p.x = rand(0,dims.w); }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,219,163,'+p.a+')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      for(var j=touchPts.length-1;j>=0;j--){
        var t = touchPts[j];
        t.x += t.vx; t.y += t.vy; t.life -= 0.02;
        if(t.life <= 0){ touchPts.splice(j,1); continue; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,155,176,'+(t.life)+')';
        ctx.arc(t.x, t.y, t.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
      requestAnimationFrame(tick);
    }
    tick();

    return { addTouch: addTouch };
  }

  /* ---------------- Candle smoke / blow puff ---------------- */
  function SmokeField(canvas){
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    var particles = [];
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); });

    function puff(xRatio, yRatio, colorFn){
      var x = xRatio * dims.w, y = yRatio * dims.h;
      var n = isMobile ? 10 : 18;
      for(var i=0;i<n;i++){
        particles.push({
          x:x, y:y,
          vx: rand(-.6,.6), vy: rand(-2.2,-1.1),
          r: rand(2,5), a: rand(.5,.9),
          grow: rand(.01,.03),
          color: colorFn
        });
      }
    }

    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save(); ctx.scale(DPR,DPR);
      for(var i=particles.length-1;i>=0;i--){
        var p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.r += p.grow; p.a -= 0.012;
        if(p.a <= 0){ particles.splice(i,1); continue; }
        ctx.beginPath();
        ctx.fillStyle = p.color ? p.color(p.a) : 'rgba(210,200,220,'+p.a+')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
      requestAnimationFrame(tick);
    }
    tick();

    return { puff: puff };
  }

  /* ---------------- Finale: heart formation + fireworks ---------------- */
  function FinaleField(canvas){
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); refreshHeartTargets(); });

    var mode = 'idle'; // idle | gather | hold | firework
    var particles = [];
    var fireworks = [];
    var count = isMobile ? 130 : 260;

    function heartPoint(t){
      // parametric heart
      var x = 16 * Math.pow(Math.sin(t),3);
      var y = 13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t);
      return { x: x, y: -y };
    }

    function refreshHeartTargets(){
      var scale = Math.min(dims.w, dims.h) / 34;
      var cx = dims.w/2, cy = dims.h*0.46;
      for(var i=0;i<particles.length;i++){
        var t = (i / particles.length) * Math.PI * 2;
        var hp = heartPoint(t);
        var jitter = rand(.85,1.05);
        particles[i].tx = cx + hp.x*scale*jitter;
        particles[i].ty = cy + hp.y*scale*jitter;
      }
    }

    for(var i=0;i<count;i++){
      particles.push({
        x: rand(0,dims.w), y: rand(0,dims.h),
        tx:0, ty:0,
        r: rand(1,2.6),
        hue: Math.random() > 0.5 ? '240,178,92' : '255,155,176',
        vx:0, vy:0
      });
    }
    refreshHeartTargets();

    function startGather(){ mode = 'gather'; setTimeout(function(){ mode='hold'; }, 2200); }
    function burstFireworks(){
      mode = 'firework';
      var bursts = isMobile ? 3 : 5;
      for(var b=0;b<bursts;b++){
        setTimeout(function(){
          var fx = rand(dims.w*0.2, dims.w*0.8);
          var fy = rand(dims.h*0.15, dims.h*0.5);
          var n = isMobile ? 26 : 42;
          var hue = Math.random() > 0.5 ? '240,178,92' : (Math.random()>0.5 ? '255,155,176':'170,140,255');
          for(var i=0;i<n;i++){
            var ang = (i/n)*Math.PI*2;
            var speed = rand(1.5,4.2);
            fireworks.push({
              x: fx, y: fy,
              vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
              a: 1, hue: hue
            });
          }
        }, b*450);
      }
    }

    function tick(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.save(); ctx.scale(DPR,DPR);

      for(var i=0;i<particles.length;i++){
        var p = particles[i];
        if(mode === 'gather' || mode === 'hold' || mode === 'firework'){
          p.x += (p.tx - p.x) * 0.045;
          p.y += (p.ty - p.y) * 0.045;
        } else {
          p.y -= 0.08;
          if(p.y < -5) p.y = dims.h+5;
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+p.hue+','+(mode==='idle'?0.35:0.85)+')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }

      for(var j=fireworks.length-1;j>=0;j--){
        var f = fireworks[j];
        f.x += f.vx; f.y += f.vy; f.vy += 0.03; f.a -= 0.014;
        if(f.a <= 0){ fireworks.splice(j,1); continue; }
        ctx.beginPath();
        ctx.fillStyle = 'rgba('+f.hue+','+f.a+')';
        ctx.arc(f.x, f.y, 1.8, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
      requestAnimationFrame(tick);
    }
    tick();

    function reset(){ 
      mode = 'idle'; 
      fireworks = []; 
      for(var i=0;i<particles.length;i++){
        particles[i].x = rand(0,dims.w);
        particles[i].y = rand(0,dims.h);
      }
    }

    return { startGather: startGather, burstFireworks: burstFireworks, reset: reset };
  }

  function FireworkField(canvas){
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); });

    var fireworks = [];
    var flashes = [];

    function burst(){
      var bursts = isMobile ? 15 : 30; // More bursts
      for(var b=0;b<bursts;b++){
        setTimeout(function(){
          var fx = rand(dims.w*0.1, dims.w*0.9);
          var fy = rand(dims.h*0.1, dims.h*0.6); // Explosions happen higher up
          
          // Add a flash effect
          flashes.push({x: fx, y: fy, a: 1});

          var n = isMobile ? 80 : 150; // Dense explosions
          var hueBase = Math.random() > 0.5 ? 40 : (Math.random()>0.5 ? 340 : 260); // Gold, Rose, Purple
          
          for(var i=0;i<n;i++){
            var ang = rand(0, Math.PI*2);
            var speed = rand(1.0, 12.0); // Variance in speed makes it spherical
            fireworks.push({
              x: fx, y: fy,
              vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
              a: 1, 
              hue: hueBase + rand(-20, 20), // Slight color variance
              lightness: rand(50, 80),
              decay: rand(0.008, 0.02) // Particles burn out at different rates
            });
          }
          
          // Premium Deep Sound Effect
          try {
            var audioCtx = window.GlobalAudioContext;
            if (audioCtx && audioCtx.state === 'running') {
                var duration = rand(1.2, 2.0);
                var bufferSize = audioCtx.sampleRate * duration;
                var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                var data = buffer.getChannelData(0);
                for (var j = 0; j < bufferSize; j++) {
                  data[j] = Math.random() * 2 - 1; // White noise
                }
                var noiseSource = audioCtx.createBufferSource();
                noiseSource.buffer = buffer;
                
                // Deep lowpass for explosion bass
                var filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(rand(400, 1000), audioCtx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + duration);
                
                var gainNode = audioCtx.createGain();
                var maxVol = rand(0.6, 1.0);
                gainNode.gain.setValueAtTime(maxVol, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
                
                noiseSource.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                noiseSource.start();
            }
          } catch(e) {}
          
        }, rand(0, 5000)); // Spread exactly over 5 seconds
      }
    }

    function tick(){
      // Premium trails using destination-out
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; // Trail length
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.globalCompositeOperation = 'lighter'; // Glow effect
      
      ctx.save(); ctx.scale(DPR,DPR);

      // Render flashes
      for(var k=flashes.length-1;k>=0;k--){
        var fl = flashes[k];
        fl.a -= 0.05;
        if(fl.a <= 0){ flashes.splice(k,1); continue; }
        var rad = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 200);
        rad.addColorStop(0, 'rgba(255,255,255,'+fl.a+')');
        rad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 200, 0, Math.PI*2);
        ctx.fill();
      }

      for(var j=fireworks.length-1;j>=0;j--){
        var f = fireworks[j];
        f.x += f.vx; f.y += f.vy; 
        f.vy += 0.15; // Gravity
        f.vx *= 0.94; // Air resistance (friction)
        f.vy *= 0.94;
        f.a -= f.decay;
        if(f.a <= 0){ fireworks.splice(j,1); continue; }
        
        ctx.beginPath();
        ctx.fillStyle = 'hsla('+f.hue+', 100%, '+f.lightness+'%, '+f.a+')';
        ctx.arc(f.x, f.y, rand(1.0, 2.5), 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
      requestAnimationFrame(tick);
    }
    tick();

    return { burst: burst };
  }

  // Stars Game Field
  function StarsGame(canvas) {
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); initNodes(); });

    var nodes = [];
    var edges = [];
    var isDragging = false;
    var currentPath = [];
    var completed = false;
    var glowAmt = 0;

    function initNodes() {
      var cx = dims.w / 2;
      var cy = dims.h / 2;
      var sc = Math.min(dims.w, dims.h) * 0.3;
      nodes = [
        { x: cx, y: cy + sc*0.8 }, // Bottom
        { x: cx - sc*0.8, y: cy - sc*0.2 }, // Left middle
        { x: cx - sc*0.4, y: cy - sc*0.6 }, // Left top
        { x: cx, y: cy - sc*0.3 }, // Top middle dip
        { x: cx + sc*0.4, y: cy - sc*0.6 }, // Right top
        { x: cx + sc*0.8, y: cy - sc*0.2 }  // Right middle
      ];
      edges = [];
      currentPath = [];
      completed = false;
      glowAmt = 0;
    }
    initNodes();

    function getClosestNode(x, y) {
      var closest = -1;
      var minDist = 40;
      for(var i=0; i<nodes.length; i++){
        var d = Math.hypot(nodes[i].x - x, nodes[i].y - y);
        if(d < minDist) { minDist = d; closest = i; }
      }
      return closest;
    }

    function handleDown(x, y) {
      if(completed) return;
      var idx = getClosestNode(x, y);
      if(idx !== -1) {
        isDragging = true;
        currentPath = [idx];
        edges = [];
      }
    }
    function handleMove(x, y) {
      if(!isDragging || completed) return;
      var idx = getClosestNode(x, y);
      if(idx !== -1 && currentPath[currentPath.length-1] !== idx) {
        currentPath.push(idx);
        edges.push({ from: currentPath[currentPath.length-2], to: idx });
        
        var uniqueNodes = new Set(currentPath);
        if(uniqueNodes.size === nodes.length && currentPath[0] === currentPath[currentPath.length-1]) {
          completed = true;
          isDragging = false;
        }
      }
    }
    function handleUp() {
      isDragging = false;
      if(!completed) {
        edges = [];
        currentPath = [];
      }
    }

    canvas.addEventListener('mousedown', function(e){ handleDown(e.offsetX, e.offsetY); });
    canvas.addEventListener('mousemove', function(e){ handleMove(e.offsetX, e.offsetY); });
    canvas.addEventListener('mouseup', handleUp);
    canvas.addEventListener('mouseleave', handleUp);

    canvas.addEventListener('touchstart', function(e){ var t=e.touches[0]; var r=canvas.getBoundingClientRect(); handleDown(t.clientX-r.left, t.clientY-r.top); e.preventDefault(); }, {passive:false});
    canvas.addEventListener('touchmove', function(e){ var t=e.touches[0]; var r=canvas.getBoundingClientRect(); handleMove(t.clientX-r.left, t.clientY-r.top); e.preventDefault(); }, {passive:false});
    canvas.addEventListener('touchend', handleUp);

    function tick() {
      ctx.clearRect(0, 0, dims.w, dims.h);
      if(completed && glowAmt < 1) glowAmt += 0.02;

      ctx.beginPath();
      for(var i=0; i<edges.length; i++) {
        var p1 = nodes[edges[i].from], p2 = nodes[edges[i].to];
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      }
      ctx.strokeStyle = completed ? 'rgba(255, 219, 163, ' + (0.5 + glowAmt*0.5) + ')' : 'rgba(255, 219, 163, 0.4)';
      ctx.lineWidth = completed ? 3 + glowAmt*2 : 2;
      ctx.stroke();

      if(completed) {
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for(var j=1; j<nodes.length; j++) ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 182, 193, ' + (glowAmt*0.3) + ')';
        ctx.fill();
      }

      for(var i=0; i<nodes.length; i++){
        var isActive = currentPath.includes(i);
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, completed ? 6 : (isActive ? 5 : 3), 0, Math.PI*2);
        ctx.fillStyle = completed ? '#fff' : (isActive ? '#ffdba3' : 'rgba(255,255,255,0.5)');
        ctx.fill();
        if(completed || isActive) {
          ctx.shadowBlur = 10; ctx.shadowColor = '#ffdba3';
          ctx.fill(); ctx.shadowBlur = 0;
        }
      }

      if(!reduced) requestAnimationFrame(tick);
    }
    tick();
  }

  // Confetti Field
  function ConfettiField(canvas) {
    var ctx = canvas.getContext('2d');
    var dims = resizeCanvas(canvas);
    window.addEventListener('resize', function(){ dims = resizeCanvas(canvas); });

    var particles = [];
    var colors = ['#d8a05e', '#ffb6c1', '#ffffff', '#c0803c'];

    function burst() {
      for(var i=0; i<150; i++) {
        particles.push({
          x: dims.w / 2 + rand(-100, 100), y: dims.h,
          vx: rand(-12, 12), vy: rand(-20, -35),
          size: rand(4, 10),
          color: colors[Math.floor(Math.random()*colors.length)],
          rot: rand(0, Math.PI*2),
          vRot: rand(-0.2, 0.2),
          life: 1, decay: rand(0.005, 0.012)
        });
      }
    }

    function tick() {
      ctx.clearRect(0,0,dims.w,dims.h);
      for(var i=particles.length-1; i>=0; i--){
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.vx *= 0.98; // friction
        p.rot += p.vRot;
        p.life -= p.decay;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();

        if(p.life <= 0 || p.y > dims.h) particles.splice(i, 1);
      }
      requestAnimationFrame(tick);
    }
    tick();

    return { burst: burst };
  }

  window.CineFX = {
    AmbientField: AmbientField,
    OpenField: OpenField,
    SmokeField: SmokeField,
    FinaleField: FinaleField,
    FireworkField: FireworkField,
    StarsGame: StarsGame,
    ConfettiField: ConfettiField,
    isMobile: isMobile,
    reduced: reduced
  };
})();
