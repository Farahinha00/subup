'use client'

interface Props {
  label?: string
  className?: string
  style?: React.CSSProperties
}

export default function SignalerButton({ label = 'Signalez-la à notre équipe', className, style }: Props) {
  function open() {
    window.dispatchEvent(new CustomEvent('open-feedback', { detail: { type: 'missing_info' } }))
  }
  return (
    <button
      type="button"
      onClick={open}
      className={className}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', ...style }}
    >
      {label}
    </button>
  )
}
