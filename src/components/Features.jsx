import React from 'react';
import coffeeMachine from '../coffee-machine.jpg';

const productItems = [
  { emoji: '☕', label: 'Espresso maşını' },
  { emoji: '🍳', label: 'Mətbəx avadanlığı' },
  { emoji: '🍽️', label: 'Qab-qacaq dəsti' },
  { emoji: '🧊', label: 'Soyuducu vitrin' },
];

const reviewItems = [
  { name: 'Rəşad M.', role: 'Restoran sahibi',     rating: '⭐⭐⭐⭐⭐', text: 'Avadanlığı 2 gündə tapdım. Satıcı etibarlı idi.' },
  { name: 'Nigar H.', role: 'Kafe meneceri',        rating: '⭐⭐⭐⭐⭐', text: 'Aşpaz profili həqiqətən yoxlanılmışdı. Tövsiyə edirəm.' },
  { name: 'Tural A.', role: 'Otel F&B direktoru',   rating: '⭐⭐⭐⭐⭐', text: 'Təchizatçı ilə birbaşa əlaqə çox rahat oldu.' },
];

const staffItems = [
  { emoji: '👨‍🍳', role: 'Aşpaz',    exp: '8 il təcrübə', rating: '⭐ 4.9' },
  { emoji: '☕',    role: 'Barista',  exp: '5 il təcrübə', rating: '⭐ 4.8' },
  { emoji: '🍽️',  role: 'Ofisiant', exp: '3 il təcrübə', rating: '⭐ 4.7' },
];

const CARD_BG = {
  position: 'absolute', inset: 0,
  backgroundSize: 'cover', backgroundPosition: 'center',
  borderRadius: 16,
};

export default function Features() {
  return (
    <section id="features" style={{ background: '#F5F0E8', padding: '80px 60px' }}>

      <p style={{ fontSize: 12, letterSpacing: '0.15em', color: '#8B6F5E', marginBottom: 12 }}>
        NİYƏ HORECAHUB?
      </p>
      <h2 style={{ fontSize: 42, color: '#2C2820', marginBottom: 48, fontWeight: 700 }}>
        Sektora xüsusi,{' '}
        <span style={{ color: '#6B8C5A', fontStyle: 'italic' }}>sıfır kompromis</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>

        {/* ── Card 1: Tez tap ─────────────────────────── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
          {/* Background: coffee machine / kitchen equipment */}
          <div style={{
            ...CARD_BG,
            backgroundImage: `url(${coffeeMachine})`,
          }} />
          {/* Dark overlay */}
          <div style={{ ...CARD_BG, background: 'rgba(74,92,63,0.85)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#C8D8BE', marginBottom: 8 }}>⚡ TEZ TAP</p>
            <h3 style={{ fontSize: 20, color: '#FFFFFF', marginBottom: 20, fontWeight: 700 }}>Hamısı bir yerdə</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {productItems.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 10,
                  padding: '16px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
                  <p style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 600, margin: 0 }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card 2: Etibarlı al ──────────────────────── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
          {/* Background: bar / restaurant interior */}
          <div style={{
            ...CARD_BG,
            backgroundImage: "url('https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80')",
          }} />
          {/* Dark overlay */}
          <div style={{ ...CARD_BG, background: 'rgba(44,40,32,0.87)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#8B9E7A', margin: 0 }}>🛡️ ETİBARLI AL</p>
              <span style={{ fontSize: 11, color: '#6B8C5A' }}>● Canlı</span>
            </div>
            <h3 style={{ fontSize: 20, color: '#fff', marginBottom: 20, fontWeight: 700 }}>Yoxlanmış profillər</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviewItems.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>{item.role}</span>
                    </div>
                    <span style={{ fontSize: 11 }}>{item.rating}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card 3: Sənin sektorun ───────────────────── */}
        <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 360 }}>
          {/* Background: restaurant kitchen with staff */}
          <div style={{
            ...CARD_BG,
            backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80')",
          }} />
          {/* Moss overlay */}
          <div style={{ ...CARD_BG, background: 'rgba(74,92,63,0.88)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#C8D8BE', marginBottom: 8 }}>🎯 SƏNİN SEKTORUN</p>
            <h3 style={{ fontSize: 20, color: '#fff', marginBottom: 20, fontWeight: 700 }}>Öz əməkdaşını seç</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {staffItems.map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, color: '#fff', fontWeight: 600, margin: 0 }}>{item.role}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{item.exp} · {item.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
