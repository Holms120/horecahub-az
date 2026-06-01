import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const PLANS = [
  {
    name: 'Standart',
    price: 'Pulsuz',
    period: 'həmişəlik',
    desc: 'Başlanğıc üçün ideal',
    features: ['1 aktiv listinq', 'Əsas profil səhifəsi', 'Daxili mesajlaşma', 'Reytinq sistemi'],
    cta: 'İndi başla',
    accent: false,
    ctaBg: '#4A5C3F',
  },
  {
    name: 'Premium',
    price: '₼49',
    period: 'aylıq',
    desc: 'Böyüməkdə olan bizneslər üçün',
    features: [
      'Limitsiz listinq',
      'Öndə görünmə (TOP)',
      'Analitika paneli',
      'Prioritet dəstək',
      'Doğrulama nişanı ✓',
    ],
    cta: 'Premium al',
    accent: true,
    ctaBg: '#6B8C5A',
  },
  {
    name: 'Korporativ',
    price: '₼199',
    period: 'aylıq',
    desc: 'Böyük şəbəkələr üçün',
    features: [
      'Premium-da olan hər şey',
      'API çıxışı',
      'Xüsusi hesab meneceri',
      'Kütləvi listinq alətləri',
      'SLA zəmanəti',
    ],
    cta: 'Əlaqə saxla',
    accent: false,
    ctaBg: '#8B6F5E',
  },
]

export default function Pricing() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.price-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 72%',
          },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="pricing" className="relative py-32 px-6 md:px-16 lg:px-24 overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Subtle background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80')",
          opacity: 0.07,
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-18">
          <p className="font-mono text-[11px] text-clay tracking-[0.32em] uppercase mb-4">Tariflər</p>
          <h2 className="font-sans font-bold text-charcoal text-3xl md:text-5xl tracking-tight mb-4">
            Biznəsinizə uyğun plan
          </h2>
          <p className="font-sans text-charcoal/45 text-base max-w-sm mx-auto">
            Pulsuz başla, böydükcə böyü. Heç bir gizli ödəniş.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`price-card opacity-0 rounded-[2rem] p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.accent
                  ? 'bg-moss text-cream shadow-2xl md:scale-[1.04] ring-1 ring-clay/40'
                  : 'bg-white border border-moss/10 text-charcoal shadow-sm'
              }`}
            >
              <div className="mb-8">
                <h3 className={`font-sans font-bold text-xl mb-1 ${plan.accent ? 'text-cream' : 'text-charcoal'}`}>
                  {plan.name}
                </h3>
                <p className={`font-sans text-sm mb-6 ${plan.accent ? 'text-cream/55' : 'text-charcoal/45'}`}>
                  {plan.desc}
                </p>
                <div className="flex items-end gap-1.5">
                  <span className={`font-drama italic text-5xl leading-none ${plan.accent ? 'text-cream' : 'text-charcoal'}`}>
                    {plan.price}
                  </span>
                  <span className={`font-mono text-[10px] mb-1 ${plan.accent ? 'text-cream/40' : 'text-charcoal/35'}`}>
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <Check size={13} className={`mt-0.5 flex-shrink-0 ${plan.accent ? 'text-clay' : 'text-moss'}`} />
                    <span className={`font-sans text-sm leading-relaxed ${plan.accent ? 'text-cream/75' : 'text-charcoal/65'}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="magnetic-btn w-full font-sans font-semibold relative overflow-hidden group"
                style={{
                  backgroundColor: plan.ctaBg,
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  height: '52px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="relative z-10">{plan.cta}</span>
                <span
                  className="absolute inset-0 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                  style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
