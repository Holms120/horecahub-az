const heroImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80'

export default function Hero() {
  return (
    <section id="hero" style={{position:'relative', height:'100vh', overflow:'hidden'}}>

      {/* Background image */}
      <img
        src={heroImage}
        alt=""
        style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}}
      />

      {/* Text overlay box */}
      <div style={{
        position:'absolute',
        left:'80px',
        top:'55%',
        transform:'translateY(-50%)',
        background:'rgba(245,240,232,0.82)',
        backdropFilter:'blur(6px)',
        WebkitBackdropFilter:'blur(6px)',
        padding:'48px',
        borderRadius:'12px',
        maxWidth:'520px'
      }}>
        <p style={{fontSize:'12px', letterSpacing:'0.15em', color:'#8B6F5E', marginBottom:'16px'}}>
          Azərbaycanda ilk Horeca Marketplace
        </p>
        <h1 style={{fontSize:'52px', lineHeight:1.1, color:'#2C2820', marginBottom:'24px'}}>
          HoReCa üçün<br/>
          <em>Marketplace.</em>
        </h1>
        <p style={{fontSize:'16px', color:'#7A7368', marginBottom:'36px'}}>
          Avadanlıq, kadr, təchizatçı — hamısı bir yerdə. Vasitəçisiz, birbaşa.
        </p>
        <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
          <button style={{background:'#6B8C5A', color:'white', padding:'14px 28px', borderRadius:'8px', border:'none', fontSize:'15px', cursor:'pointer'}}>
            Pulsuz listinq yerləşdir
          </button>
          <a href="#how" style={{color:'#2C2820', fontSize:'15px'}}>Necə işləyir →</a>
        </div>
      </div>

    </section>
  )
}
