// Mascot — uses the hand-drawn PNG from /public/mascot.png
// The image has been preprocessed to have a transparent background
// (with a conservative safety margin to preserve the semi-transparent arm).

export default function Mascot({ size = 160, className = '' }) {
  return (
    <img
      src="/mascot.png"
      alt="WordMaster unicorn mascot"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        userSelect: 'none',
      }}
      draggable={false}
    />
  )
}
