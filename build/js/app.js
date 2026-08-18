(function(){
  'use strict';
  var reduced = window.CineFX.reduced;
  var isMobile = window.CineFX.isMobile;

  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  /* ---------------------------------------------------------------------
     LOADER
     --------------------------------------------------------------------- */
  var urlParams = new URLSearchParams(window.location.search);
  var loader = document.getElementById('loader');
  var loaderNum = document.getElementById('loaderNum');
  function fakeLoad(){
    if (urlParams.get('replay') === '1') {
      loader.classList.add('is-done');
      startOpenSequence();
      return;
    }
    var n = 0;
    var imgs = document.querySelectorAll('img');
    var total = Math.max(imgs.length, 1);
    var loaded = 0;
    imgs.forEach(function(img){
      if(img.complete) loaded++;
      else img.addEventListener('load', function(){ loaded++; }, { once:true });
    });
    var iv = setInterval(function(){
      var target = Math.min(96, Math.round((loaded/total)*70) + n);
      n += Math.random()*9 + 3;
      var val = Math.min(99, Math.max(n, target));
      loaderNum.textContent = String(Math.floor(val)).padStart(2,'0');
      if(val >= 99){
        clearInterval(iv);
        loaderNum.textContent = '100';
        setTimeout(function(){
          loader.classList.add('is-done');
          startOpenSequence();
        }, 380);
      }
    }, 140);
  }

  // --- COUNTDOWN LOGIC & ADMIN OVERRIDE ---
  var isAdmin = urlParams.get('admin') === 'true' || urlParams.get('admin') === '1';

  // Check if fireworks have already been shown (localStorage)
  var fireworksAlreadySeen = localStorage.getItem('sb_fireworks_seen') === '1';
  // Admin can force-reset by passing ?reset=1
  if (urlParams.get('reset') === '1') {
    localStorage.removeItem('sb_fireworks_seen');
    fireworksAlreadySeen = false;
  }

  var targetDate = new Date('2026-08-18T20:36:00+05:30').getTime(); // DEMO: 18 Aug 8:36 PM
  var countdownOverlay = document.getElementById('countdownOverlay');
  var cdDays = document.getElementById('cd-days');
  var cdHours = document.getElementById('cd-hours');
  var cdMins = document.getElementById('cd-mins');
  var cdSecs = document.getElementById('cd-secs');

  // Secret tap to bypass
  var secretTaps = 0;
  var countdownTitle = document.querySelector('.countdown-content h2');
  if (countdownTitle) {
    countdownTitle.addEventListener('click', function() {
      secretTaps++;
      if (secretTaps >= 5) {
        isAdmin = true;
      }
    });
  }

  var countdownFinished = false;

  /* ---------------------------------------------------------------------
     HAPPY BIRTHDAY MELODY — Web Audio API synthesizer
     Notes: G G A G C B | G G A G D C | G G G5 E C B A | F F E C D C
     --------------------------------------------------------------------- */
  function playBirthdaySong() {
    try {
      var ac = window.GlobalAudioContext;
      if (!ac || ac.state !== 'running') return;

      // Reverb (convolver) for warm hall effect
      var reverbLen = ac.sampleRate * 2;
      var revBuf = ac.createBuffer(2, reverbLen, ac.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = revBuf.getChannelData(ch);
        for (var i = 0; i < reverbLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
        }
      }
      var convolver = ac.createConvolver();
      convolver.buffer = revBuf;

      var masterGain = ac.createGain();
      masterGain.gain.value = 0.38;
      masterGain.connect(ac.destination);

      var revGain = ac.createGain();
      revGain.gain.value = 0.28;
      convolver.connect(revGain);
      revGain.connect(ac.destination);

      // Note frequencies (Hz)
      var N = {
        G4:392, A4:440, B4:494, C5:523,
        D5:587, E5:659, F5:698, G5:784
      };

      // Happy Birthday melody: [note, durationBeats]
      var melody = [
        [N.G4,0.75],[N.G4,0.25],[N.A4,1],[N.G4,1],[N.C5,1],[N.B4,2],
        [N.G4,0.75],[N.G4,0.25],[N.A4,1],[N.G4,1],[N.D5,1],[N.C5,2],
        [N.G4,0.75],[N.G4,0.25],[N.G5,1],[N.E5,1],[N.C5,0.75],[N.B4,0.25],[N.A4,2],
        [N.F5,0.75],[N.F5,0.25],[N.E5,1],[N.C5,1],[N.D5,1],[N.C5,3]
      ];

      var BPM = 76;
      var beat = 60 / BPM;
      var t = ac.currentTime + 0.4; // small delay before song starts

      melody.forEach(function(step) {
        var freq = step[0], dur = step[1] * beat;
        
        // Main oscillator (sine + slight triangle for warmth)
        var osc = ac.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // Harmony: a fifth below
        var osc2 = ac.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 0.667; // perfect fifth below

        var env = ac.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + 0.04); // attack
        env.gain.setValueAtTime(1, t + dur * 0.6);
        env.gain.linearRampToValueAtTime(0, t + dur * 0.95); // release

        var env2 = ac.createGain();
        env2.gain.setValueAtTime(0, t);
        env2.gain.linearRampToValueAtTime(0.35, t + 0.04);
        env2.gain.setValueAtTime(0.35, t + dur * 0.6);
        env2.gain.linearRampToValueAtTime(0, t + dur * 0.95);

        osc.connect(env);
        env.connect(masterGain);
        env.connect(convolver);

        osc2.connect(env2);
        env2.connect(masterGain);

        osc.start(t); osc.stop(t + dur);
        osc2.start(t); osc2.stop(t + dur);

        t += dur;
      });

    } catch(e) { console.warn('Birthday song error:', e); }
  }

  function updateCountdown() {
    var now = new Date().getTime();
    var distance = targetDate - now;

    if (isAdmin) {
      distance = 0;
    }

    if (distance <= 0) {
      if (countdownOverlay && !countdownFinished) {
        countdownFinished = true;
        countdownOverlay.style.display = 'flex'; // Ensure it's visible so canvas size can be computed
        
        var canvas = document.getElementById('countdownCanvas');
        if (canvas && window.CineFX.FireworkField) {
            var fw = window.CineFX.FireworkField(canvas);
            fw.burst();
            var cdTitle = countdownOverlay.querySelector('h2');
            var cdSub = countdownOverlay.querySelector('p');
            if (cdTitle) cdTitle.textContent = "Happy Birthday!";
            if (cdSub) cdSub.textContent = "The wait is over.";
            
            if (cdDays) cdDays.textContent = "00";
            if (cdHours) cdHours.textContent = "00";
            if (cdMins) cdMins.textContent = "00";
            if (cdSecs) cdSecs.textContent = "00";

            setTimeout(function() {
                // Mark fireworks as seen so they don't repeat
                localStorage.setItem('sb_fireworks_seen', '1');
                countdownOverlay.classList.add('is-hidden');
                fakeLoad();
            }, 6500); // Wait 6.5s to let the full 5s premium firework show finish its trails
            return false;
        } else {
            countdownOverlay.classList.add('is-hidden');
            return true;
        }
      }
      return false;
    }

    if (countdownOverlay) {
      countdownOverlay.style.display = 'flex';
      var d = Math.floor(distance / (1000 * 60 * 60 * 24));
      var h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((distance % (1000 * 60)) / 1000);

      if (cdDays) cdDays.textContent = String(d).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(h).padStart(2, '0');
      if (cdMins) cdMins.textContent = String(m).padStart(2, '0');
      if (cdSecs) cdSecs.textContent = String(s).padStart(2, '0');
    }
    return false;
  }

  var startOverlay = document.getElementById('startOverlay');
  var startBtn = document.getElementById('startBtn');

  function startCountdownInterval() {
    if (updateCountdown()) {
      fakeLoad();
    } else {
      var cdInterval = setInterval(function() {
        if (updateCountdown()) {
          clearInterval(cdInterval);
          fakeLoad();
        }
      }, 1000);
    }
  }

  if (fireworksAlreadySeen) {
    // Fireworks already seen — skip startOverlay & countdown, go directly to loader
    if (startOverlay) startOverlay.classList.add('is-hidden');
    if (countdownOverlay) countdownOverlay.style.display = 'none';
    fakeLoad();
  } else if (startBtn && startOverlay) {
    // First visit — show startOverlay, unlock audio, then start countdown
    startBtn.addEventListener('click', function() {
      if (!window.GlobalAudioContext) {
        window.GlobalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.GlobalAudioContext.state === 'suspended') {
        window.GlobalAudioContext.resume();
      }
      startOverlay.classList.add('is-hidden');
      startCountdownInterval();
    });
  } else {
    startCountdownInterval();
  }

  /* ---------------------------------------------------------------------
     AMBIENT + OPEN CANVAS FIELDS
     --------------------------------------------------------------------- */
  var bgCanvas = document.getElementById('bgCanvas');
  window.CineFX.AmbientField(bgCanvas);
  var openCanvas = document.getElementById('openCanvas');
  var openField = window.CineFX.OpenField(openCanvas);

  /* ---------------------------------------------------------------------
     CUSTOM CURSOR
     --------------------------------------------------------------------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  if(!isMobile){
    var cx=0, cy=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){ tx = e.clientX; ty = e.clientY; });
    (function loop(){
      cx += (tx-cx)*0.18; cy += (ty-cy)*0.18;
      cursor.style.transform = 'translate('+cx+'px,'+cy+'px)';
      requestAnimationFrame(loop);
    })();
    window.addEventListener('mousedown', function(){ cursor.classList.add('is-down'); });
    window.addEventListener('mouseup', function(){ cursor.classList.remove('is-down'); });

    document.querySelectorAll('[data-cursor], .begin-btn, .candle, .g-card, .replay-btn, .audio-btn, .lightbox-close').forEach(function(el){
      el.addEventListener('mouseenter', function(){
        cursor.classList.add('is-active');
        cursorLabel.textContent = el.getAttribute('data-cursor') || (el.classList.contains('begin-btn') ? 'Enter' : el.classList.contains('g-card') ? 'View' : el.classList.contains('candle') ? 'Blow' : '');
      });
      el.addEventListener('mouseleave', function(){ cursor.classList.remove('is-active'); });
    });
  }

  /* ---------------------------------------------------------------------
     OPENING SEQUENCE — staged text, name letters, begin button
     --------------------------------------------------------------------- */
  function startOpenSequence(){
    var seqEls = document.querySelectorAll('.fade-seq');
    seqEls.forEach(function(el, i){
      setTimeout(function(){ el.classList.add('in'); }, 500 + i*650);
    });
    var especially = document.querySelector('.open-especially');
    setTimeout(function(){ especially.classList.add('in'); }, 500 + 2*650);

    var svgWrap = document.querySelector('.name-reveal-svg');
    if (svgWrap) {
      setTimeout(function(){ svgWrap.classList.add('in'); }, 2200);
    }
    var nameEnd = 2200 + 1000; // wait for SVG animation to start before next elements

    // Date reveal: "21" scales+blurs in, then "AUGUST" letters stagger
    var dateReveal = document.getElementById('dateReveal');
    var dateLetters = document.querySelectorAll('.date-month span');
    var dateStart = nameEnd + 380;
    setTimeout(function(){ dateReveal.classList.add('in'); }, dateStart);
    var monthStart = dateStart + 420;
    dateLetters.forEach(function(el, i){
      setTimeout(function(){ el.classList.add('in'); }, monthStart + i*75);
    });
    var monthEnd = monthStart + dateLetters.length*75;

    setTimeout(function(){
      document.getElementById('beginBtn').classList.add('in');
    }, monthEnd + 380);
  }

  /* ---------------------------------------------------------------------
     BEGIN BUTTON -> scroll into hero
     --------------------------------------------------------------------- */
  var beginBtn = document.getElementById('beginBtn');
  var bgAudio = document.getElementById('bgAudio');
  var audioDock = document.getElementById('audioDock');
  var audioToggle = document.getElementById('audioToggle');
  var started = false;

  beginBtn.addEventListener('click', function(){
    if(started) return;
    started = true;
    beginBtn.classList.add('is-launching');
    document.body.style.overflow = '';
    tryPlayAudio();
    setTimeout(function(){
      document.getElementById('s-hero').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      audioDock.classList.add('is-visible');
    }, 420);
  });

  // Admin: auto-skip Begin button
  if (isAdmin) {
    setTimeout(function(){
      if(!started){
        started = true;
        document.body.style.overflow = '';
        tryPlayAudio();
        document.getElementById('s-hero').scrollIntoView({ behavior: 'auto' });
        audioDock.classList.add('is-visible');
      }
    }, 200);
  }

  function tryPlayAudio(){
    bgAudio.volume = 0.55;
    var p = bgAudio.play();
    if(p && p.catch) p.catch(function(){ /* autoplay blocked, wait for dock click */ });
    audioToggle.classList.add('is-playing');
    audioToggle.setAttribute('aria-label','Pause music');
  }
  audioToggle.addEventListener('click', function(){
    if(bgAudio.paused){ bgAudio.play(); audioToggle.classList.add('is-playing'); audioToggle.setAttribute('aria-label','Pause music'); }
    else { bgAudio.pause(); audioToggle.classList.remove('is-playing'); audioToggle.setAttribute('aria-label','Play music'); }
  });

  // touch particles on mobile open scene
  document.getElementById('s-open').addEventListener('touchmove', function(e){
    var t = e.touches[0];
    if(t) openField.addTouch(t.clientX, t.clientY);
  }, { passive:true });

  /* ---------------------------------------------------------------------
     SCROLL REVEAL (IntersectionObserver) + progress thread + scene tags
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.2 });
  revealEls.forEach(function(el){ io.observe(el); });

  var threadFill = document.getElementById('threadFill');
  var allScenes = document.querySelectorAll('.scene[data-scene]');
  var heroTitle = document.querySelector('.hero-title');

  // Per-scene color tracking
  var sceneObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var sc = entry.target.getAttribute('data-scene');
        if(sc) document.body.setAttribute('data-scene', sc);
      }
    });
  }, { threshold: 0.5 });
  allScenes.forEach(function(s){ sceneObserver.observe(s); });

  // Parallax tilt on hero title
  if(!isMobile && heroTitle){
    document.getElementById('s-hero').addEventListener('mousemove', function(e){
      var cx = window.innerWidth/2, cy = window.innerHeight/2;
      var dx = (e.clientX - cx)/cx, dy = (e.clientY - cy)/cy;
      heroTitle.style.transform = 'rotateY('+(dx*6)+'deg) rotateX('+(-dy*4)+'deg)';
    });
    document.getElementById('s-hero').addEventListener('mouseleave', function(){
      heroTitle.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }

  window.addEventListener('scroll', function(){
    var doc = document.documentElement;
    var pct = (doc.scrollTop) / (doc.scrollHeight - doc.clientHeight) * 100;
    threadFill.style.width = pct + '%';
  }, { passive:true });


  /* ---------------------------------------------------------------------
     CAKE INTERACTION
     --------------------------------------------------------------------- */
  var candles = document.querySelectorAll('.candle');
  var cakeMsg = document.getElementById('cakeMsg');
  var cakeGlow = document.getElementById('cakeGlow');
  var cakeHint = document.getElementById('cakeHint');
  var cakeHintWrap = document.getElementById('cakeHintWrap');
  var smokeCanvas = document.getElementById('smokeCanvas');
  var smoke = window.CineFX.SmokeField(smokeCanvas);
  var litCount = candles.length;

  function candleRatio(candleEl){
    var stageRect = document.getElementById('cakeEl').getBoundingClientRect();
    var canvasRect = smokeCanvas.getBoundingClientRect();
    var r = candleEl.getBoundingClientRect();
    var x = (r.left + r.width/2 - canvasRect.left) / canvasRect.width;
    var y = (r.top - canvasRect.top) / canvasRect.height;
    return { x: x, y: y };
  }

  candles.forEach(function(c){
    c.addEventListener('click', function(){
      if(c.getAttribute('data-lit') === 'false') return;
      c.setAttribute('data-lit','false');
      // Hide hint as soon as first candle is blown
      if(cakeHintWrap) cakeHintWrap.classList.add('is-done');
      var ratio = candleRatio(c);
      smoke.puff(ratio.x, ratio.y);
      litCount--;
      cakeGlow.style.opacity = Math.max(0.15, litCount/candles.length);
      if(navigator.vibrate) navigator.vibrate([20, 10, 20]);
      if(litCount === 0){
        cakeMsg.classList.add('in');
        setTimeout(function(){ launchConfetti(document.getElementById('s-cake')); }, 200);
        setTimeout(function(){ launchConfetti(document.getElementById('s-cake')); }, 800);
        if(navigator.vibrate) navigator.vibrate([60, 30, 60, 30, 100]);
      }
    });
  });

  /* ---------------------------------------------------------------------
     LIGHTWEIGHT DOM CONFETTI BURST
     --------------------------------------------------------------------- */
  function launchConfetti(container){
    if(reduced) return;
    var colors = ['#f0b25c','#ffdba3','#ff9bb0','#a88cff'];
    var n = isMobile ? 26 : 46;
    var rect = container.getBoundingClientRect();
    for(var i=0;i<n;i++){
      var el = document.createElement('span');
      var size = Math.random()*7+4;
      el.style.cssText = [
        'position:fixed','z-index:6000','top:'+(rect.top + rect.height*0.3)+'px',
        'left:'+(rect.left + rect.width/2)+'px','width:'+size+'px','height:'+(size*0.4)+'px',
        'background:'+colors[i % colors.length],'border-radius:2px','pointer-events:none',
        'opacity:1'
      ].join(';');
      document.body.appendChild(el);
      var angle = Math.random()*Math.PI - Math.PI/2 - Math.PI/2;
      var dist = 120 + Math.random()*260;
      var dx = Math.cos(angle)*dist*(Math.random()>0.5?1:-1);
      var dy = -(200 + Math.random()*220);
      var rot = Math.random()*720 - 360;
      el.animate([
        { transform:'translate(0,0) rotate(0deg)', opacity:1 },
        { transform:'translate('+dx+'px,'+(dy*0.4)+'px) rotate('+(rot*0.5)+'deg)', opacity:1, offset:0.5 },
        { transform:'translate('+(dx*1.3)+'px,'+(Math.abs(dy)*1.6)+'px) rotate('+rot+'deg)', opacity:0 }
      ], { duration: 1600 + Math.random()*700, easing:'cubic-bezier(.16,.84,.44,1)' }).onfinish = function(node){
        return function(){ node.remove(); };
      }(el);
    }
  }

  /* ---------------------------------------------------------------------
     GALLERY — draggable cinematic track, active card focus, dots, lightbox
     --------------------------------------------------------------------- */
  var track = document.getElementById('galleryTrack');
  var viewport = document.getElementById('galleryViewport');
  var cards = Array.from(track.querySelectorAll('.g-card'));
  var dotsWrap = document.getElementById('galleryDots');
  cards.forEach(function(_, i){
    var d = document.createElement('span');
    dotsWrap.appendChild(d);
  });
  var dots = Array.from(dotsWrap.children);

  var isDown = false, startX = 0, scrollLeft = 0;
  viewport.addEventListener('pointerdown', function(e){
    if(e.pointerType !== 'mouse') return;
    isDown = true; startX = e.clientX; scrollLeft = viewport.scrollLeft;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', function(e){
    if(!isDown || e.pointerType !== 'mouse') return;
    var walk = (e.clientX - startX) * 1.2;
    viewport.scrollLeft = scrollLeft - walk;
  });
  ['pointerup','pointercancel','pointerleave'].forEach(function(evt){
    viewport.addEventListener(evt, function(e){ if(e.pointerType === 'mouse') isDown = false; });
  });

  function updateActiveCard(){
    var vRect = viewport.getBoundingClientRect();
    var center = vRect.left + vRect.width/2;
    var closest = null, closestDist = Infinity, idx = 0;
    cards.forEach(function(card, i){
      var r = card.getBoundingClientRect();
      var cardCenter = r.left + r.width/2;
      var dist = Math.abs(cardCenter - center);
      if(dist < closestDist){ closestDist = dist; closest = card; idx = i; }
    });
    cards.forEach(function(c){ c.classList.remove('is-active'); });
    if(closest) closest.classList.add('is-active');
    dots.forEach(function(d,i){ d.classList.toggle('is-active', i===idx); });
  }
  var galleryTicking = false;
  viewport.addEventListener('scroll', function(){
    if(!galleryTicking){
      requestAnimationFrame(function(){ updateActiveCard(); galleryTicking = false; });
      galleryTicking = true;
    }
  }, { passive:true });
  setTimeout(updateActiveCard, 300);
  window.addEventListener('resize', updateActiveCard);

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  cards.forEach(function(card){
    card.addEventListener('click', function(e){
      if(Math.abs((e.clientX||0) - startX) > 8 && isDown) return;
      lightboxImg.src = card.getAttribute('data-full');
      lightboxImg.alt = card.querySelector('img').alt;
      lightbox.classList.add('is-open');
    });
  });
  document.getElementById('lightboxClose').addEventListener('click', function(){ lightbox.classList.remove('is-open'); });
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox) lightbox.classList.remove('is-open'); });

  /* ---------------------------------------------------------------------
     TYPEWRITER MESSAGE
     --------------------------------------------------------------------- */
  var msg1 = "Hey Simran, today is a very special and beautiful day \u2014 let's make it the best celebration with all your friends.";
  var msg2 = "We made all of this as a little birthday present for you. Thanks for the friendship we've made and for everything you bring to our lives. Enjoy every single moment, wear your most beautiful smile, and let today be one to remember.";
  var tw1 = document.getElementById('typewriter1');
  var tw2 = document.getElementById('typewriter2');
  var typewriterStarted = false;

  function typeText(el, text, speed, done){
    var i = 0;
    (function step(){
      if(i <= text.length){
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, speed);
      } else if(done){ done(); }
    })();
  }

  var sMessage = document.getElementById('s-message');
  var msgObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting && !typewriterStarted){
        typewriterStarted = true;
        setTimeout(function(){
          typeText(tw1, msg1, reduced ? 0 : 20, function(){
            setTimeout(function(){
              typeText(tw2, msg2, reduced ? 0 : 12, function(){
                setTimeout(function(){
                  document.querySelector('.signed').classList.add('in');
                }, 300);
              });
            }, 250);
          });
        }, 500);
      }
    });
  }, { threshold: 0.4 });
  msgObserver.observe(sMessage);

  /* ---------------------------------------------------------------------
     FINALE — heart gather + fireworks
     --------------------------------------------------------------------- */
  var heartCanvas = document.getElementById('heartCanvas');
  var finaleField = window.CineFX.FinaleField(heartCanvas);
  var finaleTriggered = false;
  var finaleTimeouts = [];
  var finaleObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        if(!finaleTriggered){
          finaleTriggered = true;
          finaleField.startGather();
          // Give "Simran / 21 August" a clear moment on screen before the burst.
          finaleTimeouts.push(setTimeout(function(){ finaleField.burstFireworks(); }, 3200));
          finaleTimeouts.push(setTimeout(function(){ launchConfetti(document.getElementById('s-finale')); }, 3400));
          // 🎵 Play Happy Birthday melody + voice wish when finale loads
          finaleTimeouts.push(setTimeout(function(){
            playBirthdaySong();
            speakBirthdayWish();
          }, 800));
        }
      } else {
        if(finaleTriggered){
          finaleTriggered = false;
          finaleField.reset();
          finaleTimeouts.forEach(clearTimeout);
          finaleTimeouts = [];
          var els = document.querySelectorAll('#s-finale [data-reveal]');
          els.forEach(function(el) { el.classList.remove('in-view'); });
        }
      }
    });
  }, { threshold: 0.1 });
  finaleObserver.observe(document.getElementById('s-finale'));

  document.getElementById('replayBtn').addEventListener('click', function(){
    window.scrollTo(0, 0);
    var url = new URL(window.location.href);
    url.searchParams.set('replay', '1');
    window.location.href = url.toString();
  });

  /* ---------------------------------------------------------------------
     BIRTHDAY WISH AUDIO — plays your recorded voice from audio/wish.mp3
     Record your voice and save it as: build/audio/wish.mp3
     --------------------------------------------------------------------- */
  function speakBirthdayWish() {
    try {
      var wishAudio = new Audio('audio/wish.mp3');
      wishAudio.volume = 0.95;
      // Start playing 1.8 seconds after melody begins
      setTimeout(function() {
        wishAudio.play().catch(function(e) {
          console.log('Wish audio not found or blocked:', e);
        });
      }, 1800);
    } catch(e) { console.warn('Wish audio error:', e); }
  }

})();

// ==========================================
// FEATURE 3: HEART TRAILS
// ==========================================
(function() {
  var lastTrail = 0;
  var trailDelay = 60; // ms between hearts

  function createHeart(x, y) {
    var now = Date.now();
    if (now - lastTrail < trailDelay) return;
    lastTrail = now;

    var heart = document.createElement('div');
    heart.className = 'trail-heart';
    // Randomize between a few emojis
    var emojis = ['&#10024;', '&#10024;', '&#9829;', '&#10024;']; 
    heart.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
    
    // random scatter
    var rx = (Math.random() - 0.5) * 20;
    var ry = (Math.random() - 0.5) * 20;
    heart.style.left = (x + rx) + 'px';
    heart.style.top = (y + ry) + 'px';
    
    var colors = ['var(--rose)', 'var(--gold-soft)', '#fff'];
    heart.style.color = colors[Math.floor(Math.random() * colors.length)];
    
    var size = Math.random() * 8 + 12;
    heart.style.fontSize = size + 'px';

    document.body.appendChild(heart);
    
    setTimeout(function() {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
    }, 1000);
  }

  window.addEventListener('mousemove', function(e) {
    createHeart(e.clientX, e.clientY);
  });

  window.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
      createHeart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, {passive: true});
})();

// ==========================================
// FEATURE 2: MICROPHONE BLOWING LOGIC
// ==========================================
(function() {
  var cakeSection = document.getElementById('s-cake');
  if(!cakeSection) return;
  
  var micEnabled = false;
  
  function initMic() {
    if(micEnabled || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
      micEnabled = true;
      var ac = window.AudioContext || window.webkitAudioContext;
      var audioCtx = new ac();
      var analyser = audioCtx.createAnalyser();
      var microphone = audioCtx.createMediaStreamSource(stream);
      // Use createScriptProcessor (deprecated but highly compatible)
      var javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioCtx.destination);
      
      var blowCounter = 0;
      javascriptNode.onaudioprocess = function() {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var values = 0;
        var length = array.length;
        for (var i = 0; i < length; i++) {
          values += (array[i]);
        }
        var average = values / length;
        
        // Threshold for blowing sound
        if (average > 45) { 
          blowCounter++;
          if (blowCounter > 5) { // Ensure it's a continuous sound, not just a tap
            var litCandles = document.querySelectorAll('.candle[data-lit="true"]');
            if(litCandles.length > 0) {
              // Blow out one candle at a time randomly
              var randomCandle = litCandles[Math.floor(Math.random() * litCandles.length)];
              randomCandle.click();
              blowCounter = 0; // reset
            } else {
              // All candles out, stop processing
              javascriptNode.disconnect();
              microphone.disconnect();
            }
          }
        } else {
          blowCounter = 0;
        }
      }
    }).catch(function(err) {
      console.log('Mic access denied or not supported', err);
    });
  }

  var observer = new IntersectionObserver(function(entries) {
    if(entries[0].isIntersecting) {
      initMic();
    }
  }, { threshold: 0.5 });
  observer.observe(cakeSection);
})();
