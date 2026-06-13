export default function Logo({ height = 38, light = false }) {
  return (
    <img
      src={light ? '/logo-white.svg' : '/logo.svg'}
      alt="HorecaHub.az"
      height={height}
      style={{ height }}
    />
  )
}
