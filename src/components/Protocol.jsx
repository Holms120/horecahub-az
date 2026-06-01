import { useEffect, useRef } from 'react'
import coffeeMachine from '../assets/coffeemachine.jpg'
import qabqacaq from '../assets/qabqacaq.jpg'
import emekdash from '../assets/emekdash.jpg'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── SVG animations ─────────────────────────────────── */
function RotatingCircles() {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="opacity-25">
      {[80, 62, 46, 30].map((r, i) => (
        <circle
          key={r}
          cx="110" cy="110" r={r}
          fill="none"
          stroke="#CC5833"
          strokeWidth="1.2"
          strokeDasharray={`${r * 0.28} ${r * 0.14}`}
          style={{
            transformOrigin: '110px 110px',
            animation: `spin-slow ${3.5 + i * 1.8}s linear infinite ${i % 2 === 1 ? 'reverse' : ''}`,
          }}
        />
      ))}
      <circle cx="110" cy="110" r="7" fill="#CC5833" opacity="0.7" />
      <circle cx="110" cy="110" r="3" fill="#F2F0E9" opacity="0.9" />
    </svg>
  )
}

function ScannerGrid() {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="opacity-25">
      {Array.from({ length: 7 }).map((_, row) =>
        Array.from({ length: 7 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={18 + col * 30}
            cy={18 + row * 30}
            r="2.5"
            fill="#F2F0E9"
            opacity="0.5"
          />
        ))
      )}
      <line
        x1="0" y1="110" x2="220" y2="110"
        stroke="#CC5833"
        strokeWidth="1.5"
        opacity="0.85"
        style={{ animation: 'scan-line 2.4s ease-in-out infinite' }}
      />
    </svg>
  )
}

function EkgWave() {
  return (
    <svg width="240" height="90" viewBox="0 0 240 90" className="opacity-35">
      <path
        d="M0,45 L25,45 L35,12 L48,78 L60,22 L72,65 L84,35 L96,55 L110,45 L130,45 L142,16 L155,74 L167,25 L178,60 L190,38 L202,50 L215,45 L240,45"
        fill="none"
        stroke="#CC5833"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="600"
        style={{ animation: 'ekg-dash 2s linear infinite' }}
      />
    </svg>
  )
}

/* ── Card data ──────────────────────────────────────── */
const CARDS = [
  {
    number: '01',
    title: 'Listinq yerləşdir',
    desc: 'Avadanlığınızı, xidmətinizi və ya şəxsi profilinizi əlavə edin. Ödənişsiz, 5 dəqiqəyə.',
    bg: '#2E4036',
    img: coffeeMachine,
    Animation: RotatingCircles,
  },
  {
    number: '02',
    title: 'Alıcılarla əlaqə qur',
    desc: 'Yoxlanmış profillər, real reytinqlər, birbaşa ünsiyyət. Heç bir vasitəçi yoxdur.',
    bg: '#4A5C3F',
    img: qabqacaq,
    Animation: ScannerGrid,
  },
  {
    number: '03',
    title: 'Böyüt və qazan',
    desc: 'HoReCa ekosisteminin tam gücündən istifadə et — analitika, data, genişlənən şəbəkə.',
    bg: '#1c2e22',
    img: emekdash,
    Animation: EkgWave,
  },
]

export default function Protocol() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.protocol-card')

      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.88,
            opacity: 0.35,
            filter: 'blur(8px)',
            ease: 'none',
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top 85%',
              end: 'top top',
              scrub: true,
            },
          })
        }

        gsap.fromTo(
          card.querySelectorAll('.card-content > *'),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 70%',
            },
          }
        )
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="protocol">
      {CARDS.map((card) => {
        const Anim = card.Animation
        return (
          <div
            key={card.number}
            className="protocol-card sticky top-0 min-h-[100dvh] flex items-center justify-center px-6 md:px-16 lg:px-24 py-24 relative overflow-hidden"
            style={{ backgroundColor: card.bg }}
          >
            {/* Background image with dark overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${card.img})`, opacity: 0.22 }}
            />
            <div className="relative z-10 max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="card-content flex flex-col gap-6">
                <span className="font-mono text-7xl font-bold leading-none" style={{ color: '#FFFFFF' }}>
                  {card.number}
                </span>
                <h3 className="font-sans font-bold text-3xl md:text-5xl tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
                  {card.title}
                </h3>
                <p className="font-sans text-base md:text-lg leading-relaxed max-w-sm" style={{ color: '#E8F0E3' }}>
                  {card.desc}
                </p>
                <button className="magnetic-btn self-start mt-2 relative bg-clay/90 text-cream px-7 py-3.5 rounded-full font-sans font-semibold text-sm overflow-hidden group">
                  <span className="relative z-10">Başla →</span>
                  <span className="absolute inset-0 bg-clay translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
                </button>
              </div>

              <div className="flex items-center justify-center opacity-80">
                <Anim />
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
