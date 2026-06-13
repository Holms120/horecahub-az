export default function Logo({ height = 38, light = false }) {
  return (
    <img 
      src="/logo.svg" 
      alt="HorecaHub.az" 
      height={height} 
      style={{ 
        height,
        filter: light ? 'brightness(0) invert(1)' : 'none'
      }} 
    />
  )
}
