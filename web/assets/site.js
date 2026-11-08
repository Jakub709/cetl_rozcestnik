(function(){
  var html=document.documentElement, body=document.body;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bgVideos=[].slice.call(document.querySelectorAll('.bg video'));
  var store={get:function(k){try{return sessionStorage.getItem(k);}catch(e){return null;}},set:function(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}};

  function playAll(){ bgVideos.forEach(function(v){ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }); }
  function ready(){ html.classList.add('ready'); body.classList.add('ready'); }

  /* --- page entry: long intro on first homepage visit, short slats everywhere else --- */
  var isHome = !!document.querySelector('.loader');
  if(reduce){
    html.classList.add('entered','done'); ready();
    bgVideos.forEach(function(v){ v.removeAttribute('autoplay'); try{v.pause();}catch(e){} });
  } else if(isHome && !store.get('cetl-intro')){
    store.set('cetl-intro','1');
    html.classList.add('intro');
    requestAnimationFrame(function(){ html.classList.add('go'); });
    setTimeout(ready, 1550);
    setTimeout(function(){ html.classList.add('done'); }, 2600);
    playAll();
  } else {
    html.classList.add('done');
    requestAnimationFrame(function(){ html.classList.add('enter'); });
    setTimeout(ready, 380);
    setTimeout(function(){ html.classList.add('entered'); html.classList.remove('enter'); }, 1100);
    playAll();
  }

  /* --- page leave: slats drive in, then navigate --- */
  if(!reduce){
    document.addEventListener('click', function(e){
      var a=e.target.closest && e.target.closest('a[href]');
      if(!a || e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if(a.target && a.target!=='_self') return;
      var href=a.getAttribute('href');
      if(!href || href.charAt(0)==='#' || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
      var url=new URL(a.href, location.href);
      if(url.pathname===location.pathname && url.hash) return;
      e.preventDefault();
      body.classList.remove('menu-open'); html.classList.remove('menu-open');
      html.classList.remove('entered','enter'); html.classList.add('leave');
      setTimeout(function(){ location.href=a.href; }, 560);
    });
    window.addEventListener('pageshow', function(e){ if(e.persisted){ html.classList.remove('leave'); html.classList.add('entered','ready'); } });
  }

  /* --- scroll: parallax, header, day → night --- */
  var top=document.querySelector('.top'), shade=document.querySelector('.bg .shade');
  var nightSec=document.querySelector('[data-night]'), hasNoc=!!document.querySelector('.bg .v-noc');
  var ticking=false, cookieAsked=false;
  function onScroll(){
    ticking=false;
    var y=window.scrollY||window.pageYOffset, h=window.innerHeight;
    var p=Math.min(Math.max(y/h,0),1);
    html.style.setProperty('--p', p.toFixed(3));
    if(top) top.classList.toggle('solid', y>40);
    if(y>120 && !cookieAsked){ cookieAsked=true; showCookie(); }
    var night = hasNoc && nightSec && nightSec.getBoundingClientRect().top < h*0.4;
    body.classList.toggle('night', !!night);
    if(shade) shade.style.opacity = night ? .28 : (p*.5).toFixed(3);
  }
  window.addEventListener('scroll', function(){ if(!ticking){ ticking=true; requestAnimationFrame(onScroll); } }, {passive:true});
  window.addEventListener('resize', onScroll);

  /* --- count-up --- */
  var nums=[].slice.call(document.querySelectorAll('[data-count]'));
  var fmt=function(n){ return Math.round(n).toLocaleString('cs-CZ'); };
  if(!reduce && 'IntersectionObserver' in window){
    nums.forEach(function(el){ el.textContent='0'; });
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        io.unobserve(en.target);
        var el=en.target, to=+el.dataset.count, t0=null, dur=1700;
        (function step(t){ if(!t0) t0=t; var k=Math.min((t-t0)/dur,1); var e=1-Math.pow(1-k,4);
          el.textContent=fmt(to*e); if(k<1) requestAnimationFrame(step); })(performance.now());
      });
    },{threshold:.6});
    nums.forEach(function(el){ io.observe(el); });
  } else { nums.forEach(function(el){ el.textContent=fmt(+el.dataset.count); }); }

  /* --- fuel price digits roll like a price board --- */
  var rolls=[].slice.call(document.querySelectorAll('[data-roll]'));
  rolls.forEach(function(el){
    var txt=el.getAttribute('data-roll'); el.setAttribute('aria-label', txt); el.textContent='';
    var wrap=document.createElement('span'); wrap.className='roll'; wrap.setAttribute('aria-hidden','true');
    txt.split('').forEach(function(ch,i){
      if(!/\d/.test(ch)){ var s=document.createElement('span'); s.textContent=ch; wrap.appendChild(s); return; }
      var d=document.createElement('span'); d.className='d'; var col=document.createElement('span');
      for(var n=0;n<=9;n++){ var it=document.createElement('i'); it.textContent=n; col.appendChild(it); }
      col.style.transitionDelay=(i*0.08)+'s'; col.dataset.to=ch; d.appendChild(col); wrap.appendChild(d);
    });
    el.appendChild(wrap);
  });
  function spin(el){ el.querySelectorAll('.d>span').forEach(function(c){ c.style.transform='translateY(-'+c.dataset.to+'em)'; }); }
  if(rolls.length){
    if(reduce || !('IntersectionObserver' in window)) rolls.forEach(spin);
    else { var io2=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ io2.unobserve(en.target); spin(en.target); } }); },{threshold:.5}); rolls.forEach(function(el){ io2.observe(el); }); }
  }
  document.querySelectorAll('[data-today]').forEach(function(el){ el.textContent=new Date().toLocaleDateString('cs-CZ'); });

  /* --- mobile menu --- */
  var burger=document.querySelector('.burger');
  if(burger){
    burger.addEventListener('click', function(){
      var open=!body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open); html.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.mnav a').forEach(function(a){ a.addEventListener('click', function(){ body.classList.remove('menu-open'); html.classList.remove('menu-open'); burger.setAttribute('aria-expanded','false'); }); });
  }

  /* --- cookie card --- */
  function showCookie(){ var c=document.querySelector('.cookie'); if(c && !store.get('cetl-cookie')) c.classList.add('show'); }
  document.querySelectorAll('.cookie button').forEach(function(b){ b.addEventListener('click', function(){ document.querySelector('.cookie').classList.remove('show'); store.set('cetl-cookie','1'); }); });

  /* --- intro film --- */
  var film=document.getElementById('film');
  if(film){
    var fv=film.querySelector('video');
    document.querySelectorAll('[data-film]').forEach(function(b){ b.addEventListener('click', function(){
      if(typeof film.showModal==='function') film.showModal(); else film.setAttribute('open','');
      bgVideos.forEach(function(v){ v.pause(); });
      fv.currentTime=0; var p=fv.play(); if(p&&p.catch) p.catch(function(){});
    }); });
    film.querySelector('[data-close]').addEventListener('click', function(){ film.close ? film.close() : film.removeAttribute('open'); });
    film.addEventListener('click', function(e){ if(e.target===film) film.close(); });
    film.addEventListener('close', function(){ fv.pause(); if(!reduce) playAll(); });
    fv.addEventListener('ended', function(){ film.close(); });
  }

  /* --- forms: no server here, so a valid form opens the visitor's e-mail app with the message filled in --- */
  document.querySelectorAll('form[data-mailto]').forEach(function(f){
    var err=f.querySelector('.form-msg.err');
    f.querySelectorAll('input,textarea').forEach(function(i){ i.addEventListener('blur', function(){ i.classList.add('touched'); }); });
    f.addEventListener('submit', function(e){
      e.preventDefault();
      f.querySelectorAll('input,textarea').forEach(function(i){ i.classList.add('touched'); });
      if(!f.checkValidity()){ if(err) err.hidden=false; var bad=f.querySelector(':invalid'); if(bad) bad.focus(); return; }
      if(err) err.hidden=true;
      var lines=[].slice.call(f.querySelectorAll('input:not([type=submit]),textarea')).map(function(i){ return (i.getAttribute('placeholder')||i.name)+': '+i.value; });
      location.href='mailto:'+f.dataset.mailto+'?subject='+encodeURIComponent(f.dataset.subject||'Web CETL Cargo')+'&body='+encodeURIComponent(lines.join('\n'));
    });
  });
  document.querySelectorAll('input[data-type]').forEach(function(i){
    i.addEventListener('focus', function(){ i.type=i.dataset.type; });
    i.addEventListener('blur', function(){ if(!i.value) i.type='text'; });
  });

  onScroll();
})();
