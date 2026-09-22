import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Compass, Search, MessageSquare, CheckCircle2, QrCode, RotateCcw,
  ShieldCheck, Star, Package, MapPin, Sparkles, Zap, HeartHandshake, Users, Clock,
} from 'lucide-react';
import api from '../api/client.js';
import { Logo, Avatar, Reveal, Spotlight, CursorGlow, ItemCardSkeleton, AnimatedNumber } from '../components/index.js';
import { formatImagePath } from '../utils/format.js';

const steps = [
  { icon: Search, title: 'Discover', text: 'Browse useful items shared by students across campus — calculators, chargers, cameras and more.' },
  { icon: MessageSquare, title: 'Request', text: 'Send the owner a request telling them why you need it and for how long.' },
  { icon: CheckCircle2, title: 'Accept', text: 'The owner accepts, and the item is reserved for you.' },
  { icon: QrCode, title: 'Handover', text: 'Meet at the location and verify the transfer with a one-time QR or code.' },
  { icon: RotateCcw, title: 'Return', text: 'Bring it back on time, review each other, and grow both your trust scores.' },
];

function NetworkCanvas() {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const primary = '79, 70, 229';
    const accent = '16, 185, 129';
    const nodes = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: i % 4 === 0 ? 2.4 : 1.6,
      c: i % 3 === 0 ? accent : primary,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.c}, ${0.14 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.c}, 0.5)`;
        ctx.fill();
        if (!reduceMotion) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const t = setTimeout(() => setReady(true), 350);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      clearTimeout(t);
    };
  }, []);

  return (
    <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgb(226 232 240 / 0.6) 1px, transparent 1px), linear-gradient(90deg, rgb(226 232 240 / 0.6) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 78%)' }} />
      <div className="absolute -left-32 top-[-10%] h-[30rem] w-[30rem] rounded-full bg-primary-500/10 blur-3xl animate-blob-a" />
      <div className="absolute right-[-12%] top-[6%] h-[26rem] w-[26rem] rounded-full bg-accent-500/10 blur-3xl animate-blob-b" />
      <div className="absolute left-1/2 top-[38%] h-64 w-64 -translate-x-1/2 rounded-full bg-primary-300/15 blur-3xl animate-blob-c" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

function FloatingCard({ icon: Icon, title, sub, className, tone = 'primary' }) {
  return (
    <div className={`card absolute z-10 hidden w-44 p-4 shadow-lift lg:flex ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone === 'accent' ? 'bg-accent-50 text-accent-600 ring-accent-100' : 'bg-primary-50 text-primary-600 ring-primary-100'}`}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{sub}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    api.get('/items?limit=4&sort=newest')
      .then((res) => setFeatured(res.data.items))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <CursorGlow />
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? 'glass shadow-soft' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {[['Home', '/'], ['Discover', '/discover'], ['How it works', '/#how-it-works'], ['Trust & safety', '/#trust']].map(([label, href]) => (
              <a key={label} href={href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/60 hover:text-primary-600">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
            <Link to="/register" className="btn-primary">Get Started <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative flex min-h-[88vh] items-center overflow-hidden">
          <NetworkCanvas />
          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-16">
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-white/70 px-4 py-1.5 text-sm font-semibold text-accent-700 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
                </span>
                Free peer-to-peer borrowing for campus
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="text-[2.6rem] font-extrabold leading-[1.06] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.2rem]">
                Borrow what you need.
                <br />
                <span className="text-gradient">Share what you have.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                A free campus community where students share useful items with each other — zero cost, zero deposits, fully trust-backed.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.19 }} className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link to="/discover" className="btn-primary px-7 py-3.5 text-base">Explore Items <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/register" className="btn-secondary px-7 py-3.5 text-base">Start sharing</Link>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-12 flex items-center justify-center gap-8 sm:gap-12 lg:justify-start">
                {[['0 ₹', 'All exchanges free'], ['100%', 'Students only'], ['QR', 'Verified handovers']].map(([value, label]) => (
                  <div key={label} className="text-center lg:text-left">
                    <p className="text-2xl font-extrabold text-slate-900">
                      <AnimatedNumber value={value === 'QR' ? 0 : value === '100%' ? 100 : 0} />
                      {value === '0 ₹' ? ' ₹' : value === '100%' ? '%' : ''}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block" aria-hidden="true">
              <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="net-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.45" />
                  </linearGradient>
                  <radialGradient id="hero-core" cx="0.35" cy="0.3" r="1">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="45%" stopColor="#EEF2FF" />
                    <stop offset="100%" stopColor="#E0E7FF" />
                  </radialGradient>
                </defs>
                <motion.path d="M200,200 C90,90 310,60 200,200 S90,330 200,200 S310,310 200,200" fill="none" stroke="url(#net-grad)" strokeWidth="1.5" strokeDasharray="3 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
                {['80,70', '320,90', '90,300', '315,295', '200,60', '200,335', '55,190', '345,200'].map((p, i) => {
                  const [x, y] = p.split(',').map(Number);
                  return (
                    <g key={i}>
                      <line x1="200" y1="200" x2={x} y2={y} stroke="rgb(79 70 229 / 0.18)" strokeWidth="1" />
                      <circle cx={x} cy={y} r="7" fill="white" stroke={i % 2 ? '#10B981' : '#6366F1'} strokeWidth="2" className="animate-pulse-soft" />
                    </g>
                  );
                })}
                <circle cx="200" cy="200" r="46" fill="url(#hero-core)" stroke="rgb(79 70 229 / 0.25)" strokeWidth="1" />
                <text x="200" y="196" textAnchor="middle" fontSize="17" fontWeight="800" fill="#312E81" fontFamily="Inter, sans-serif">Campus</text>
                <text x="200" y="214" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4F46E5" fontFamily="Inter, sans-serif">Sharing Network</text>
              </svg>
              <FloatingCard icon={Compass} title="Discover" sub="Items nearby" className="left-[-2%] top-[16%] animate-float" />
              <FloatingCard icon={Zap} title="Request" sub="Instant match" tone="accent" className="right-[-4%] top-[30%] animate-float-slow" />
              <FloatingCard icon={QrCode} title="Handover" sub="One-time QR" className="left-[2%] bottom-[16%] animate-float-slow" />
              <FloatingCard icon={HeartHandshake} title="Return" sub="Trust score +" tone="accent" className="right-[0%] bottom-[26%] animate-float" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-0 h-24 bg-gradient-to-b from-transparent to-surface" />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Live on campus</p>
                <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Featured right now</h2>
                <p className="mt-2 text-slate-500">Items students are sharing nearby this week</p>
              </div>
              <Link to="/discover" className="btn-secondary">Browse the marketplace <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)
              : featured.map((item, i) => (
                  <Reveal key={item._id} delay={i * 0.07}>
                    <Link to={`/items/${item._id}`} className="card card-hover group block overflow-hidden">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {item.images?.[0] ? (
                          <img src={formatImagePath(item.images[0])} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 text-primary-300"><Package className="h-12 w-12" strokeWidth={1.4} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> Available
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-primary-600">{item.category}</span>
                          <span className="inline-flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{item.owner?.rating ?? '—'}</span>
                        </div>
                        <h3 className="mt-1 truncate font-bold text-slate-900">{item.name}</h3>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{item.owner?.name?.slice(0, 2).toUpperCase() || '?'}</span>
                            <span className="max-w-[7rem] truncate font-medium">{item.owner?.name}</span>
                          </span>
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {item.location}</span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
          </div>
        </section>

        <section id="how-it-works" className="relative overflow-hidden py-24">
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-surface via-primary-50/40 to-surface" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Five steps. Zero cost. Endless convenience.</h2>
              <p className="mt-3 text-lg text-slate-600">From finding the item to handing it back, every exchange is guided and secure.</p>
            </Reveal>

            <div className="relative mt-16">
              <motion.div aria-hidden="true" className="absolute left-0 right-0 top-8 hidden h-0.5 lg:block" style={{ background: 'linear-gradient(90deg, #4F46E5, #10B981)' }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} />
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
                {steps.map((step, i) => (
                  <Reveal key={step.title} delay={i * 0.12}>
                    <div className="flex items-start gap-4 lg:flex-col lg:items-start">
                      <motion.div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-soft ring-2 ring-primary-100" whileHover={{ y: -4, rotate: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                        <step.icon className="h-7 w-7" strokeWidth={1.8} />
                        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[11px] font-bold text-white shadow-md">{i + 1}</span>
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600">{step.text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
              <div>
                <p className="eyebrow">Why BorrowBox</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for students, grounded in trust.</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">No marketplace fees. No payment gateways. Just a clean, reliable way to borrow a calculator, a charger, an umbrella or a drawing kit from someone two minutes away.</p>
                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
                  {[
                    { icon: Users, title: 'A real campus community', text: 'Every lender is a verified student with a trust score from real exchanges.' },
                    { icon: Zap, title: 'Get items instantly', text: 'Find what you need in minutes and often borrow it the same day.' },
                    { icon: Sparkles, title: 'Zero cost, always', text: 'No rentals, no deposits, no payments — free forever.' },
                    { icon: ShieldCheck, title: 'Trust & safety built in', text: 'Reputation scores, reviews and QR handover verification.' },
                  ].map((r) => (
                    <div key={r.title} className="group">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100 transition group-hover:scale-110 group-hover:bg-accent-100"><r.icon className="h-5 w-5" strokeWidth={1.9} /></span>
                      <h3 className="mt-3.5 font-bold text-slate-900">{r.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Spotlight className="mx-auto w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-200/60 to-primary-100/30 p-0.5">
                <div className="rounded-[calc(1.5rem-1px)] bg-white p-6 shadow-soft">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                    <Avatar user={{ name: 'Arun Kumar', rating: 5 }} size="lg" />
                    <div>
                      <p className="font-bold text-slate-900">Arun Kumar</p>
                      <p className="text-xs text-slate-500">Lending the Scientific Calculator</p>
                    </div>
                    <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-600 ring-1 ring-inset ring-amber-100"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 5.0</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      { icon: Package, label: 'Item ready at', value: 'Main Block · Rack 4' },
                      { icon: Clock, label: 'Typical borrow', value: '1–2 days' },
                      { icon: QrCode, label: 'Handover', value: 'One-time QR verified' },
                      { icon: ShieldCheck, label: 'Owner trust', value: '96 / 100' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-100"><row.icon className="h-4 w-4" strokeWidth={1.9} /></span>
                        <div>
                          <p className="font-semibold text-slate-800">{row.value}</p>
                          <p className="text-xs text-slate-400">{row.label}</p>
                        </div>
                      </div>
                    ))}
                    <Link to="/register" className="btn-primary mt-4 w-full">Request to borrow it <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </Spotlight>
            </div>
          </Reveal>
        </section>

        <section id="trust" className="relative overflow-hidden py-24">
          <div aria-hidden="true" className="absolute inset-0 bg-primary-950" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow text-accent-400">Trust & Safety</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Borrow with confidence, lend with peace of mind.</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: 'Trust scores', text: 'Every student has a reliability score built from real transactions.' },
                { icon: Star, title: 'Post-exchange reviews', text: 'Both parties review each other after every completed exchange.' },
                { icon: QrCode, title: 'QR handover', text: 'Items change hands only after a one-time QR or code verification.' },
                { icon: HeartHandshake, title: 'Moderated community', text: 'Inappropriate listings are reported and reviewed by moderators.' },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 0.08}>
                  <div className="group h-full rounded-2xl bg-white/[0.06] p-6 ring-1 ring-inset ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.1] hover:ring-accent-400/30">
                    <item.icon className="h-7 w-7 text-accent-400" strokeWidth={1.8} />
                    <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 px-8 py-16 text-center text-white shadow-modal sm:px-16">
              <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-accent-300/20 blur-3xl" />
              <div className="relative">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
                  <HeartHandshake className="h-7 w-7" />
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Your closet probably has an item someone needs today.</h2>
                <p className="mx-auto mt-3 max-w-xl text-lg text-primary-100">List your first item in under a minute and help a fellow student. It's free, it's easy, and it builds the whole community up.</p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/register" className="rounded-xl bg-white px-7 py-3.5 text-base font-bold text-primary-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-50">Start Sharing</Link>
                  <Link to="/discover" className="rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">Explore Items</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white pb-12 pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">A free campus community where students can share useful items with each other.</p>
            </div>
            {[
              { heading: 'Product', links: [['Discover', '/discover'], ['How it works', '/#how-it-works'], ['Trust & safety', '/#trust']] },
              { heading: 'Account', links: [['Log in', '/login'], ['Create account', '/register']] },
              { heading: 'Community', links: [['Dashboard', '/dashboard'], ['My Borrowings', '/borrowings'], ['My Lending', '/lending']] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-sm font-bold text-slate-900">{col.heading}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}><Link to={href} className="text-sm text-slate-500 transition hover:text-primary-600">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-sm text-slate-400 sm:flex-row">
            <span>BorrowBox · Free forever · No rentals, no deposits, no payments.</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary-500" /> Made with trust, for campus.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}