@extends('layouts.app')

@section('title', 'Hiram Contractors Ltd | Professional Excellence')

@push('styles')
<style>
/* ── HERO ── */
.hero{
  position:relative;min-height:100vh;
  display:flex;align-items:center;
  overflow:visible;
  padding-top:106px;
}

/* ── SLIDESHOW BG ── */
.hero-slides{position:absolute;inset:0;z-index:0;overflow:hidden;}
.hero-slide{
  position:absolute;inset:0;
  opacity:0;
  background-size:cover;background-position:center;
  transform:scale(1.06);
  transition:opacity 1.4s cubic-bezier(.4,0,.2,1), transform 8s ease-out;
}
.hero-slide.active{
  opacity:1;
  transform:scale(1.0);
}
.hero-slide::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(105deg, rgba(5,8,15,.88) 0%, rgba(5,8,15,.55) 55%, rgba(5,8,15,.3) 100%);
}

/* Slide dots */
.hero-dots{
  position:absolute;bottom:2.5rem;right:5vw;z-index:2;
  display:flex;gap:.5rem;align-items:center;
}
.hero-dot{
  width:20px;height:2px;background:rgba(255,255,255,.25);
  cursor:pointer;transition:background .3s,width .3s;
  border:none;padding:0;
}
.hero-dot.active{width:36px;background:var(--orange);}

/* ── HERO CONTENT ── */
.hero-content{
  position:relative;z-index:1;
  padding:0 5vw;max-width:780px;
}

.hero-location{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'Jost',sans-serif;font-size:.7rem;font-weight:400;
  letter-spacing:.32em;text-transform:uppercase;
  color:rgba(232,98,9,.9);margin-bottom:.9rem;
  opacity:0;animation:fadeUp .8s .1s forwards;
}
.hero-location::before{content:'';display:block;width:24px;height:1px;background:var(--orange);}

.hero-eyebrow{
  font-family:'Jost',sans-serif;font-size:.82rem;font-weight:400;
  letter-spacing:.18em;text-transform:uppercase;
  color:rgba(255,255,255,.45);margin-bottom:1.1rem;
  opacity:0;animation:fadeUp .8s .2s forwards;
}

/* ── ANIMATED TITLE ── */
.hero-title{
  font-family:'Old Standard TT',serif;
  font-size:clamp(2.2rem,5.5vw,4.2rem);
  font-weight:700;
  line-height:1.15;
  color:#fff;
  margin-bottom:1.8rem;
  letter-spacing:.02em;
  text-transform:uppercase;
}

/* lines 1 and 3 — normal slide-up */
.hero-title .line{
  display:block;
  overflow:hidden;
}
.hero-title .line span{
  display:block;
  opacity:0;
  transform:translateY(100%);
  animation:slideUp .9s cubic-bezier(.22,1,.36,1) forwards;
}
.hero-title .line:nth-child(1) span{ animation-delay:.3s; }
.hero-title .line:nth-child(3) span{ animation-delay:.6s; }

/* line 2 — flip line: no overflow:hidden, perspective here creates the 3D space */
.hero-title .line-swap{
  display:block;
  overflow:visible;
  perspective:600px;
  perspective-origin:50% 50%;
}

/* the word itself */
#heroSwapWord{
  display:inline-block;
  color:var(--orange);
  transform-style:preserve-3d;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
  opacity:1;
}

.hero-desc{
  font-family:'Jost',sans-serif;
  font-size:.9rem;line-height:1.85;
  color:rgba(245,240,235,.55);max-width:460px;
  margin-bottom:2.4rem;
  opacity:0;animation:fadeUp .8s .85s forwards;
  font-weight:300;
  letter-spacing:.02em;
}

.hero-actions{
  display:flex;gap:1rem;flex-wrap:wrap;
  opacity:0;animation:fadeUp .8s 1s forwards;
}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}

/* Scroll indicator */
.hero-scroll{
  position:absolute;bottom:2.5rem;left:5vw;z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:.5rem;
  opacity:0;animation:fadeUp .8s 1.2s forwards;
}
.hero-scroll-label{
  font-family:'Jost',sans-serif;font-size:.6rem;
  letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.3);
  writing-mode:vertical-rl;
}
.hero-scroll-line{
  width:1px;height:0;
  background:linear-gradient(to bottom,transparent,var(--orange));
  animation:growLine 1.2s 1.4s ease forwards;
}
@keyframes growLine{from{height:0;}to{height:50px;}}

/* NCA badge */
.hero-badge{
  position:absolute;top:50%;right:5vw;
  transform:translateY(-50%);z-index:1;
  display:flex;flex-direction:column;align-items:center;gap:.7rem;
  opacity:0;animation:fadeUp .8s .9s forwards;
}
.hero-badge-item{
  display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:1rem 1.4rem;
  border:1px solid rgba(232,98,9,.18);
  background:rgba(5,8,15,.45);backdrop-filter:blur(10px);
  clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
  min-width:100px;
}
.hero-badge-num{
  font-family:'Old Standard TT',serif;font-size:2rem;font-weight:700;
  color:var(--orange);line-height:1;
}
.hero-badge-label{
  font-family:'Jost',sans-serif;font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:rgba(255,255,255,.45);margin-top:.2rem;
}

/* ── STATS STRIP ── */
.stats-strip{
  background:#0d0d0d;
  border-top:2px solid var(--orange);
  border-bottom:1px solid rgba(255,255,255,.06);
  padding:2.5rem 5vw;
  display:grid;grid-template-columns:repeat(4,1fr);
  gap:1px;
}
.stat-block{text-align:center;padding:1.2rem 1rem;position:relative;}
.stat-block::after{content:'';position:absolute;right:0;top:25%;bottom:25%;width:1px;background:rgba(255,255,255,.07);}
.stat-block:last-child::after{display:none;}
.stat-block-num{
  font-family:'Old Standard TT',serif;font-size:2.6rem;font-weight:700;
  color:var(--orange);line-height:1;display:block;
}
.stat-block-label{
  font-family:'Jost',sans-serif;font-size:.65rem;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(255,255,255,.4);margin-top:.3rem;display:block;
}

/* ── SERVICES ── */
.services-grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:1.5px;margin-top:3.5rem;
  background:rgba(232,98,9,.1);
}
.service-card{
  position:relative;overflow:hidden;
  background:#0c0c0c;padding:2.4rem 2rem;
  cursor:pointer;transition:background .35s;
}
.service-card::before{content:'';position:absolute;bottom:0;left:0;right:100%;height:2px;background:var(--orange);transition:right .4s ease;}
.service-card:hover{background:#141414;}.service-card:hover::before{right:0;}
.service-icon{width:46px;height:46px;margin-bottom:1.4rem;display:flex;align-items:center;justify-content:center;border:1px solid rgba(232,98,9,.3);clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);color:var(--orange);font-size:1.2rem;transition:background .3s,border-color .3s;}
.service-card:hover .service-icon{background:var(--orange);color:#fff;border-color:var(--orange);}
.service-num{position:absolute;top:1.2rem;right:1.2rem;font-family:'Old Standard TT',serif;font-size:3rem;font-weight:700;color:rgba(232,98,9,.05);line-height:1;pointer-events:none;transition:color .3s;}
.service-card:hover .service-num{color:rgba(232,98,9,.09);}
.service-name{font-family:'Old Standard TT',serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.04em;}
.service-desc{font-family:'Jost',sans-serif;font-size:.83rem;line-height:1.7;color:rgba(255,255,255,.45);font-weight:300;}
.service-link{display:inline-flex;align-items:center;gap:6px;margin-top:1.2rem;font-family:'Jost',sans-serif;font-size:.75rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--orange);text-decoration:none;transition:gap .2s;}
.service-card:hover .service-link{gap:12px;}

/* ── PROJECTS MOSAIC ── */
.projects-mosaic{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:260px 260px;gap:4px;margin-top:3.5rem;}
.project-thumb{position:relative;overflow:hidden;cursor:pointer;}
.project-thumb:first-child{grid-column:1/2;grid-row:1/3;}
.project-thumb img{width:100%;height:100%;object-fit:cover;transform:scale(1.07);transition:transform .7s cubic-bezier(.22,1,.36,1),filter .4s;filter:brightness(.7) saturate(.8);}
.project-thumb:hover img{transform:scale(1.01);filter:brightness(.88) saturate(1);}
.project-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,8,15,.88) 0%,transparent 55%);display:flex;flex-direction:column;justify-content:flex-end;padding:1.4rem;opacity:0;transition:opacity .35s;}
.project-thumb:hover .project-overlay{opacity:1;}
.project-tag{font-family:'Jost',sans-serif;font-size:.65rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--orange);margin-bottom:.3rem;}
.project-name{font-family:'Old Standard TT',serif;font-size:1rem;font-weight:700;color:#fff;}

/* ── WHY US ── */
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;margin-top:3.5rem;align-items:center;}
.why-img-wrap{position:relative;}
.why-img{width:100%;aspect-ratio:4/5;object-fit:cover;clip-path:polygon(0 0,calc(100% - 28px) 0,100% 28px,100% 100%,28px 100%,0 calc(100% - 28px));transition:clip-path .5s ease;}
.why-img-wrap:hover .why-img{clip-path:polygon(0 0,100% 0,100% 0,100% 100%,0 100%,0 100%);}
.why-badge{position:absolute;bottom:-1.5rem;right:-1.5rem;background:var(--orange);width:110px;height:110px;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.why-badge .num{font-family:'Old Standard TT',serif;font-size:2.2rem;font-weight:700;color:#fff;line-height:1;}
.why-badge .lbl{font-family:'Jost',sans-serif;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.8);}
.why-points{display:flex;flex-direction:column;gap:0;margin-top:1.8rem;}
.why-point{display:flex;gap:1rem;align-items:flex-start;padding:1.4rem 0;border-bottom:1px solid rgba(255,255,255,.05);transition:padding-left .3s;}
.why-point:first-child{padding-top:0;}.why-point:last-child{border-bottom:none;}.why-point:hover{padding-left:.4rem;}
.why-point-icon{flex-shrink:0;width:38px;height:38px;background:rgba(232,98,9,.07);border:1px solid rgba(232,98,9,.22);display:flex;align-items:center;justify-content:center;color:var(--orange);font-size:.95rem;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:background .25s;}
.why-point:hover .why-point-icon{background:rgba(232,98,9,.16);}
.why-point-text h4{font-family:'Old Standard TT',serif;font-size:.95rem;font-weight:700;color:#fff;margin-bottom:.25rem;text-transform:uppercase;letter-spacing:.03em;}
.why-point-text p{font-family:'Jost',sans-serif;font-size:.82rem;line-height:1.65;color:rgba(255,255,255,.42);font-weight:300;}

/* ── TESTIMONIALS ── */
.testimonials-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5px;margin-top:3.5rem;background:rgba(232,98,9,.08);}
.testimonial-card{background:#0d0d0d;padding:2.2rem;position:relative;transition:background .3s;}
.testimonial-card:hover{background:#111;}
.quote-mark{font-family:'Old Standard TT',serif;font-size:4rem;font-weight:700;color:rgba(232,98,9,.12);line-height:.8;display:block;margin-bottom:.4rem;}
.testimonial-text{font-family:'Jost',sans-serif;font-size:.85rem;line-height:1.85;color:rgba(255,255,255,.55);margin-bottom:1.4rem;font-weight:300;}
.testimonial-author{display:flex;align-items:center;gap:.8rem;}
.author-avatar{width:38px;height:38px;border-radius:50%;background:var(--maroon);border:2px solid rgba(232,98,9,.35);display:flex;align-items:center;justify-content:center;font-family:'Old Standard TT',serif;font-size:.85rem;font-weight:700;color:var(--orange);}
.author-name{font-family:'Old Standard TT',serif;font-size:.88rem;font-weight:700;color:#fff;}
.author-role{font-family:'Jost',sans-serif;font-size:.68rem;color:rgba(232,98,9,.75);letter-spacing:.06em;}

/* ── CONTACT ── */
.contact-layout{display:grid;grid-template-columns:1fr 1.5fr;gap:5rem;margin-top:3.5rem;}
.contact-info{display:flex;flex-direction:column;gap:1.8rem;}
.contact-item{display:flex;align-items:flex-start;gap:1rem;}
.contact-icon{flex-shrink:0;width:40px;height:40px;background:rgba(232,98,9,.07);border:1px solid rgba(232,98,9,.22);display:flex;align-items:center;justify-content:center;color:var(--orange);font-size:.9rem;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);}
.contact-item-label{font-family:'Jost',sans-serif;font-size:.68rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--orange);margin-bottom:.2rem;}
.contact-item-val{font-family:'Jost',sans-serif;font-size:.85rem;color:rgba(255,255,255,.58);line-height:1.65;font-weight:300;}
.contact-social{display:flex;gap:.6rem;margin-top:.3rem;}
.social-btn{width:36px;height:36px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);text-decoration:none;font-size:.8rem;clip-path:polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%);transition:background .2s,color .2s,border-color .2s;}
.social-btn:hover{background:var(--orange);border-color:var(--orange);color:#fff;}

/* ── FORM ── */
.quote-form{display:flex;flex-direction:column;gap:1rem;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.form-group{display:flex;flex-direction:column;gap:.35rem;}
.form-label{font-family:'Jost',sans-serif;font-size:.65rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.38);}
.form-input,.form-select,.form-textarea{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);padding:.78rem .95rem;color:#fff;font-family:'Jost',sans-serif;font-size:.86rem;font-weight:300;outline:none;transition:border-color .2s,background .2s;-webkit-appearance:none;}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--orange);background:rgba(232,98,9,.04);}
.form-input::placeholder,.form-textarea::placeholder{color:rgba(255,255,255,.18);}
.form-select option{background:#1a1a1a;color:#fff;}
.form-textarea{resize:vertical;min-height:100px;}
.form-submit{background:var(--orange);color:#fff;border:none;padding:.95rem 2.4rem;font-family:'Jost',sans-serif;font-weight:500;font-size:.88rem;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;align-self:flex-start;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);transition:background .2s,transform .15s,box-shadow .2s;}
.form-submit:hover{background:var(--orange-bright);transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,98,9,.3);}
.map-wrap{margin-top:3rem;border:1px solid rgba(232,98,9,.15);overflow:hidden;}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .hero{padding-top:72px;}
  .hero-badge{display:none;}
  .stats-strip{grid-template-columns:repeat(2,1fr);}
  .why-grid{grid-template-columns:1fr;}
  .why-img-wrap{display:none;}
  .projects-mosaic{grid-template-columns:1fr 1fr;grid-template-rows:200px 200px 200px;}
  .project-thumb:first-child{grid-column:1/3;grid-row:1/2;}
  .contact-layout{grid-template-columns:1fr;}
  .form-row{grid-template-columns:1fr;}
  .hero-title{font-size:clamp(2rem,8vw,3.2rem);}
}
@media(max-width:600px){
  .services-grid{grid-template-columns:1fr;}
  .stats-strip{grid-template-columns:repeat(2,1fr);}
}
</style>
@endpush

@section('content')

<!-- ══════════════════════ HERO ══════════════════════ -->
<section class="hero" id="home">

  <!-- Auto-swiping background slides -->
  <div class="hero-slides" id="heroSlides">
    <div class="hero-slide active" style="background-image:url('/images/1.png');"></div>
    <div class="hero-slide" style="background-image:url('/images/2.png');"></div>
    <div class="hero-slide" style="background-image:url('/images/3.png');"></div>
    <div class="hero-slide" style="background-image:url('/images/4.png');"></div>
  </div>

  <div class="hero-content">
    <div class="hero-location">Limuru & Karen, Nairobi</div>
    <div class="hero-eyebrow">Engineering Excellence for a Sustainable Future</div>

    <h1 class="hero-title">
      <span class="line"><span>Building</span></span>
      <span class="line-swap"><span id="heroSwapWord">Excellence</span></span>
      <span class="line"><span>Across Kenya</span></span>
    </h1>

    <p class="hero-desc">
      Hiram Contractors Limited delivers premier construction solutions — from residential homes to commercial complexes, road works to precision interior finishes. Professional. Precise. Proven.
    </p>
    <div class="hero-actions">
      <a href="#contact" class="btn-primary">Request a Quote</a>
      <a href="{{ route('projects.index') }}" class="btn-secondary">View Our Work</a>
    </div>
  </div>

  <div class="hero-badge">
    <div class="hero-badge-item">
      <span class="hero-badge-num">{{ $settings['years_active'] }}</span>
      <span class="hero-badge-label">Years Active</span>
    </div>
    <div class="hero-badge-item">
      <span class="hero-badge-num">200+</span>
      <span class="hero-badge-label">Projects Done</span>
    </div>
    <div class="hero-badge-item">
      <span class="hero-badge-num">NCA</span>
      <span class="hero-badge-label">Registered</span>
    </div>
  </div>

  <div class="hero-scroll">
    <span class="hero-scroll-label">Scroll</span>
    <div class="hero-scroll-line"></div>
  </div>

  <!-- Slide dots -->
  <div class="hero-dots" id="heroDots"></div>

</section>

<!-- ══════════════════════ STATS STRIP ══════════════════════ -->
<div class="stats-strip reveal">
  <div class="stat-block">
    <span class="stat-block-num">{{ $settings['years_active'] }}</span>
    <span class="stat-block-label">Years of Excellence</span>
  </div>
  <div class="stat-block">
    <span class="stat-block-num">200+</span>
    <span class="stat-block-label">Projects Completed</span>
  </div>
  <div class="stat-block">
    <span class="stat-block-num">NCA</span>
    <span class="stat-block-label">Registered & Compliant</span>
  </div>
  <div class="stat-block">
    <span class="stat-block-num">2</span>
    <span class="stat-block-label">Office Locations</span>
  </div>
</div>

<div class="slash-divider"></div>

<!-- ══════════════════════ SERVICES ══════════════════════ -->
<section class="section" id="services">
  <div class="section-label reveal">Our Services</div>
  <h2 class="section-title reveal reveal-delay-1">What We <span>Build</span></h2>
  <p class="section-body reveal reveal-delay-2">From foundation to finish — complete construction solutions for residential, commercial and industrial clients across Kenya.</p>

  <div class="services-grid">
    @foreach($services as $i => $service)
    <div class="service-card reveal {{ $i > 0 ? 'reveal-delay-' . min($i % 3 + 1, 3) : '' }}">
      <span class="service-num">{{ str_pad($i+1, 2, '0', STR_PAD_LEFT) }}</span>
      <div class="service-icon">{{ $service->icon }}</div>
      <h3 class="service-name">{{ $service->name }}</h3>
      <p class="service-desc">{{ $service->short_description }}</p>
      <a href="{{ route('services.index') }}#{{ $service->slug }}" class="service-link">Learn More →</a>
    </div>
    @endforeach
  </div>
</section>

<div class="slash-divider"></div>

<!-- ══════════════════════ PROJECTS ══════════════════════ -->
<section class="section section-alt" id="projects">
  <div class="section-label reveal">Our Portfolio</div>
  <h2 class="section-title reveal reveal-delay-1">Featured <span>Projects</span></h2>
  <p class="section-body reveal reveal-delay-2">A snapshot of quality work delivered by our teams across Kenya — from structural builds to precision interior finishes.</p>

  <div class="projects-mosaic reveal reveal-delay-1">
    @foreach($allProjects->take(5) as $project)
    <div class="project-thumb">
      <img src="{{ $project->image_url }}" alt="{{ $project->title }}" loading="lazy">
      <div class="project-overlay">
        <div class="project-tag">{{ $project->category_label }}</div>
        <div class="project-name">{{ $project->title }}</div>
      </div>
    </div>
    @endforeach
  </div>

  <div style="text-align:center;margin-top:3rem;">
    <a href="{{ route('projects.index') }}" class="btn-primary">View Full Gallery</a>
  </div>
</section>

<div class="slash-divider"></div>

<!-- ══════════════════════ WHY US ══════════════════════ -->
<section class="section" id="about">
  <div class="why-grid">
    <div>
      <div class="section-label reveal">Why Hiram</div>
      <h2 class="section-title reveal reveal-delay-1">Built on <span>Trust</span><br>& Precision</h2>
      <p class="section-body reveal reveal-delay-2" style="margin-bottom:0;">
        Founded in 2015, Hiram Contractors Limited is NCA-registered for buildings, roads and mechanical works. We operate across Kenya from our offices in Limuru and Karen, committed to quality, safety and timely delivery on every project.
      </p>

      <div class="why-points">
        <div class="why-point reveal">
          <div class="why-point-icon">✓</div>
          <div class="why-point-text">
            <h4>NCA Registered & Compliant</h4>
            <p>Professionally registered with the National Construction Authority for buildings, roads and mechanical works — your guarantee of legitimacy.</p>
          </div>
        </div>
        <div class="why-point reveal reveal-delay-1">
          <div class="why-point-icon">🎯</div>
          <div class="why-point-text">
            <h4>Quality Workmanship</h4>
            <p>We prioritize superior workmanship and high-quality materials on every project, with continuous improvement in our standards.</p>
          </div>
        </div>
        <div class="why-point reveal reveal-delay-2">
          <div class="why-point-icon">🤝</div>
          <div class="why-point-text">
            <h4>Customer-First Approach</h4>
            <p>Our clients are at the heart of what we do. We build long-term relationships through transparency, reliability and dependability.</p>
          </div>
        </div>
        <div class="why-point reveal reveal-delay-3">
          <div class="why-point-icon">💡</div>
          <div class="why-point-text">
            <h4>Innovation-Driven</h4>
            <p>We embrace innovative technologies and methodologies to enhance efficiency and deliver better outcomes for every client.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="why-img-wrap reveal reveal-delay-2">
      <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80" alt="Construction Site" class="why-img" loading="lazy">
      <div class="why-badge">
        <span class="num">{{ $settings['years_active'] }}</span>
        <span class="lbl">Years of<br>Excellence</span>
      </div>
    </div>
  </div>
</section>

<div class="slash-divider"></div>

<!-- ══════════════════════ TESTIMONIALS ══════════════════════ -->
<section class="section section-alt" id="testimonials">
  <div class="section-label reveal">Client Stories</div>
  <h2 class="section-title reveal reveal-delay-1">What Our <span>Clients</span> Say</h2>

  <div class="testimonials-wrap">
    <div class="testimonial-card reveal">
      <span class="quote-mark">"</span>
      <p class="testimonial-text">Hiram Contractors built our family home in Limuru and the quality exceeded our expectations. The team was professional, on schedule and transparent throughout the entire process.</p>
      <div class="testimonial-author">
        <div class="author-avatar">JM</div>
        <div><div class="author-name">James M.</div><div class="author-role">Residential Client · Limuru</div></div>
      </div>
    </div>
    <div class="testimonial-card reveal reveal-delay-1">
      <span class="quote-mark">"</span>
      <p class="testimonial-text">The renovation work done on our Karen office was outstanding. Interior finishes, cabinetry and the complete overhaul — all completed on time and within budget.</p>
      <div class="testimonial-author">
        <div class="author-avatar">SW</div>
        <div><div class="author-name">Sarah W.</div><div class="author-role">Commercial Client · Karen</div></div>
      </div>
    </div>
    <div class="testimonial-card reveal reveal-delay-2">
      <span class="quote-mark">"</span>
      <p class="testimonial-text">Highly skilled team. We hired them for foundation and structural works on our multi-unit project. They handled complexity well and kept communication clear throughout.</p>
      <div class="testimonial-author">
        <div class="author-avatar">PK</div>
        <div><div class="author-name">Peter K.</div><div class="author-role">Property Developer · Nairobi</div></div>
      </div>
    </div>
  </div>
</section>

<div class="slash-divider"></div>

<!-- ══════════════════════ CONTACT ══════════════════════ -->
<section class="section" id="contact">
  <div class="section-label reveal">Get In Touch</div>
  <h2 class="section-title reveal reveal-delay-1">Request a <span>Quote</span></h2>
  <p class="section-body reveal reveal-delay-2">Tell us about your project and we'll get back to you promptly with a tailored quotation.</p>

  @if(session('success'))
    <div style="background:rgba(232,98,9,.1);border:1px solid rgba(232,98,9,.35);padding:.9rem 1.4rem;margin-top:1.4rem;color:var(--orange);font-family:'Jost',sans-serif;letter-spacing:.05em;">
      {{ session('success') }}
    </div>
  @endif

  <div class="contact-layout">
    <div class="contact-info">
      <div class="contact-item reveal">
        <div class="contact-icon">📞</div>
        <div>
          <div class="contact-item-label">Phone</div>
          <div class="contact-item-val">{{ $settings['phone_1'] }}<br>{{ $settings['phone_2'] }}<br>{{ $settings['phone_3'] }}</div>
        </div>
      </div>
      <div class="contact-item reveal reveal-delay-1">
        <div class="contact-icon">✉️</div>
        <div>
          <div class="contact-item-label">Email</div>
          <div class="contact-item-val">{{ $settings['email'] }}</div>
        </div>
      </div>
      <div class="contact-item reveal reveal-delay-2">
        <div class="contact-icon">📍</div>
        <div>
          <div class="contact-item-label">Offices</div>
          <div class="contact-item-val">{{ $settings['address'] }}</div>
        </div>
      </div>
      <div class="contact-item reveal reveal-delay-3">
        <div class="contact-icon">🕐</div>
        <div>
          <div class="contact-item-label">Working Hours</div>
          <div class="contact-item-val">Mon – Fri: 8:00 AM – 5:00 PM<br>Saturday: 10:00 AM – 4:00 PM<br>Sunday & Public Holidays: Closed</div>
        </div>
      </div>
      <div class="reveal reveal-delay-4">
        <div class="contact-item-label" style="margin-bottom:.7rem;">Follow Us</div>
        <div class="contact-social">
          @if($settings['facebook_url'])<a href="{{ $settings['facebook_url'] }}" class="social-btn" target="_blank" rel="noopener">f</a>@endif
          @if($settings['instagram_url'])<a href="{{ $settings['instagram_url'] }}" class="social-btn" target="_blank" rel="noopener">📷</a>@endif
          @if($settings['tiktok_url'])<a href="{{ $settings['tiktok_url'] }}" class="social-btn" target="_blank" rel="noopener">♪</a>@endif
          <a href="https://wa.me/{{ $settings['whatsapp_number'] }}" class="social-btn" target="_blank" rel="noopener">💬</a>
          @if($settings['twitter_url'])<a href="{{ $settings['twitter_url'] }}" class="social-btn" target="_blank" rel="noopener">𝕏</a>@endif
        </div>
      </div>
    </div>

    <form class="quote-form reveal reveal-delay-1" action="{{ route('quote.store') }}" method="POST" id="quoteForm">
      @csrf
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-input" type="text" name="name" placeholder="Your full name" required value="{{ old('name') }}">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input class="form-input" type="tel" name="phone" placeholder="07XX XXX XXX" required value="{{ old('phone') }}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input class="form-input" type="email" name="email" placeholder="your@email.com" value="{{ old('email') }}">
      </div>
      <div class="form-group">
        <label class="form-label">Service Needed *</label>
        <select class="form-select" name="service_needed" required>
          <option value="" disabled selected>Select a service…</option>
          @foreach($services as $s)
            <option {{ old('service_needed') == $s->name ? 'selected' : '' }}>{{ $s->name }}</option>
          @endforeach
          <option {{ old('service_needed') == 'Other' ? 'selected' : '' }}>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Project Details *</label>
        <textarea class="form-textarea" name="message" placeholder="Describe your project — location, size, timeline, budget range…" required>{{ old('message') }}</textarea>
      </div>
      <button type="submit" class="form-submit">Send Request →</button>
      <p id="formStatus" style="display:none;color:var(--orange);font-size:.85rem;margin-top:.5rem;"></p>
    </form>
  </div>

  @if($settings['google_map_embed'])
  <div class="map-wrap reveal" style="margin-top:3rem;">
    <iframe src="{{ $settings['google_map_embed'] }}" width="100%" height="380" style="border:0;display:block;filter:grayscale(.85) invert(.88) contrast(.9);" allowfullscreen loading="lazy"></iframe>
  </div>
  @endif
</section>

@endsection

@push('scripts')
<script>
/* ── HERO SLIDESHOW ── */
(function(){
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('heroDots');
  let current = 0;
  const interval = 10000;

  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'hero-dot' + (i === 0 ? ' active' : '');
    btn.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(btn);
  });

  function goTo(n) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
  }

  setInterval(() => goTo(current + 1), interval);
})();

/* ── HERO WORD SWAP ── */
(function(){
  const words = ['Excellence','Precision','Quality','Integrity'];
  const el = document.getElementById('heroSwapWord');
  let idx = 0;
  let animating = false;

  function flipWord() {
    if (animating) return;
    animating = true;

    /* Step 1: rotate out to the right (90deg) + fade */
    el.style.transition = 'transform 0.5s cubic-bezier(.55,0,.45,1), opacity 0.25s ease';
    el.style.transform  = 'rotateY(90deg)';
    el.style.opacity    = '0';

    setTimeout(function() {
      /* Step 2: swap text, snap to -90deg (coming from left), invisible */
      idx = (idx + 1) % words.length;
      el.textContent     = words[idx];
      el.style.transition = 'none';
      el.style.transform  = 'rotateY(-90deg)';
      el.style.opacity    = '0';

      /* Step 3: one rAF pair to let the browser register the snap */
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          el.style.transition = 'transform 0.5s cubic-bezier(.55,0,.45,1), opacity 0.25s ease 0.05s';
          el.style.transform  = 'rotateY(0deg)';
          el.style.opacity    = '1';
          setTimeout(function(){ animating = false; }, 550);
        });
      });
    }, 520);
  }

  setInterval(flipWord, 10000); /* ← change swap interval here (ms) */
})();

/* ── QUOTE FORM ── */
document.getElementById('quoteForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = this.querySelector('.form-submit');
  const status = document.getElementById('formStatus');
  btn.textContent = 'Sending…'; btn.disabled = true;
  try {
    const res = await fetch('{{ route("quote.store") }}', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      },
      body: new FormData(this)
    });
    const data = await res.json();
    if(data.success){
      status.style.display = 'block';
      status.textContent = data.message;
      this.reset();
      setTimeout(() => { status.style.display = 'none'; }, 6000);
    }
  } catch(err) {
    status.style.display = 'block';
    status.textContent = 'Something went wrong. Please call us directly.';
    status.style.color = '#ff6b6b';
  }
  btn.textContent = 'Send Request →'; btn.disabled = false;
});
</script>
@endpush