import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import { APP_TEXT } from '../../constants/appText.js'
import './AvatarCropModal.css'

const t = APP_TEXT.profile.photo
const CROP = 280 // size of the square crop window, in px
const OUTPUT = 512 // size of the picture that is uploaded
const MAX_ZOOM = 4
const STEP = 12 // arrow-key nudge, in px

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Drag the picture to place it, zoom with the slider or the mouse wheel; the part inside the round window is what is
// uploaded (as a square JPEG: the server then resizes it to its final size).
function Cropper({ file, busy, onCancel, onConfirm }) {
  const [url, setUrl] = useState(null)
  const [size, setSize] = useState(null) // natural size of the picture
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // picture centre relative to the window centre
  const [failed, setFailed] = useState(false)
  const imgRef = useRef(null)
  const drag = useRef(null)

  // Created and revoked in the same effect: React (StrictMode) mounts effects twice in development, and a URL made
  // once during render would already be revoked by the first cleanup
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  // zoom 1 = the shorter side exactly fills the window
  const base = size ? CROP / Math.min(size.w, size.h) : 1
  const scale = base * zoom
  const limits = (s) => {
    const sc = base * s
    return size ? { x: Math.max(0, (size.w * sc - CROP) / 2), y: Math.max(0, (size.h * sc - CROP) / 2) } : { x: 0, y: 0 }
  }
  const place = (next, s = zoom) => {
    const max = limits(s)
    setOffset({ x: clamp(next.x, -max.x, max.x), y: clamp(next.y, -max.y, max.y) })
  }
  const changeZoom = (value) => {
    const next = clamp(value, 1, MAX_ZOOM)
    setZoom(next)
    place(offset, next) // zooming out must not leave a gap at the edges
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }
  const onPointerMove = (e) => {
    if (drag.current) place({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const onWheel = (e) => changeZoom(zoom - e.deltaY * 0.002)
  const onKeyDown = (e) => {
    const move = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key]
    if (!move) return
    e.preventDefault()
    place({ x: offset.x + move[0], y: offset.y + move[1] })
  }

  const confirm = () => {
    // The window's top-left corner, in the picture's own pixels
    const side = CROP / scale
    const sx = (size.w * scale - CROP) / 2 / scale - offset.x / scale
    const sy = (size.h * scale - CROP) / 2 / scale - offset.y / scale
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, OUTPUT, OUTPUT)
    ctx.drawImage(imgRef.current, sx, sy, side, side, 0, 0, OUTPUT, OUTPUT)
    canvas.toBlob((blob) => blob && onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.92)
  }

  return (
    <div className="crop">
      <p className="crop-hint">{failed ? t.unreadable : t.cropHint}</p>
      <div
        className="crop-stage"
        style={{ width: CROP, height: CROP }}
        tabIndex={0}
        role="group"
        aria-label={t.cropHint}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <img
          ref={imgRef}
          src={url ?? undefined}
          alt=""
          draggable={false}
          onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={() => setFailed(true)}
          style={
            size
              ? {
                  width: size.w * scale,
                  height: size.h * scale,
                  left: CROP / 2 + offset.x - (size.w * scale) / 2,
                  top: CROP / 2 + offset.y - (size.h * scale) / 2,
                }
              : { visibility: 'hidden' }
          }
        />
        <span className="crop-ring" aria-hidden="true" />
      </div>

      <label className="crop-zoom">
        <span>{t.zoom}</span>
        <input type="range" min="1" max={MAX_ZOOM} step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} disabled={!size} />
      </label>

      <div className="modal-actions crop-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          {t.cancel}
        </button>
        <button type="button" className="btn btn-primary" onClick={confirm} disabled={!size || busy}>
          {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
          {t.save}
        </button>
      </div>
    </div>
  )
}

// Mounted only while a file is chosen, so every picture starts centred at zoom 1.
export default function AvatarCropModal({ file, busy, onCancel, onConfirm }) {
  return (
    <Modal open={Boolean(file)} onClose={busy ? () => {} : onCancel} title={t.cropTitle} size="sm">
      {file && <Cropper file={file} busy={busy} onCancel={onCancel} onConfirm={onConfirm} />}
    </Modal>
  )
}
