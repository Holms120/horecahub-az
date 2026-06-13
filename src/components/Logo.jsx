export default function Logo({ light = false, height = 38 }) {
  return (
    <img
      src="/logo.svg"
      alt="HorecaHub.az"
      height={height}
      style={{
        height,
        filter: light ? 'brightness(0) invert(1)' : 'none',
      }}
    />
  )
}
