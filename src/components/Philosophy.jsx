import { useEffect, useRef } from 'react'
import tehcizat from '../assets/tehcizat.jpg'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { value: '500+', label: 'Aktiv listinq' },
  { value: '98%',  label: 'Yoxlanmış profil' },
  { value: '48s',  label: 'Orta cavab vaxtı' },
]

export default function Philosophy() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.philo-reveal',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="px-6 md:px-16 lg:px-24"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        position: 'relative',
        backgroundImage: `url(${tehcizat})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#F5F0E8',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(245,240,232,0.70)',
      }} />
      <div className="max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>

        {/* Label */}
        <p
          className="philo-reveal font-mono text-[11px] tracking-[0.35em] uppercase mb-16"
          style={{ color: 'rgba(44,40,32,0.4)', opacity: 0 }}
        >
          Fəlsəfəmiz
        </p>

        {/* Contrast statements */}
        <p
          className="philo-reveal font-sans text-lg md:text-2xl leading-relaxed max-w-2xl mb-8"
          style={{ color: 'rgba(44,40,32,0.55)', opacity: 0 }}
        >
          Ümumi bazarlar hər kəs üçün hər şeyi satar —<br />
          restoran üçün də, tikinti üçün də.
        </p>

        <p
          className="philo-reveal font-drama italic text-4xl md:text-6xl lg:text-7xl leading-[1.1] max-w-3xl mb-12"
          style={{ color: '#2C2820', opacity: 0 }}
        >
          Biz isə{' '}
          <span style={{ color: '#8B6F5E' }}>yalnız HoReCa</span>{' '}
          üçün qurulduq.
        </p>

        {/* Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t"
          style={{ borderColor: 'rgba(44,40,32,0.1)', marginTop: '0', paddingTop: '60px' }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.value}
              className="philo-reveal"
              style={{ opacity: 0, transitionDelay: `${i * 80}ms` }}
            >
              <div className="font-drama italic text-5xl mb-2" style={{ color: '#6B8C5A' }}>
                {s.value}
              </div>
              <div className="font-sans text-sm" style={{ color: 'rgba(44,40,32,0.5)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
