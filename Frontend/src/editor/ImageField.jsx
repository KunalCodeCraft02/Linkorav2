import { useRef, useState } from 'react'
import { assetUrl } from '../lib/api'
import { UploadIcon, CloseIcon } from '../components/icons'

/**
 * An image control: shows the current image (or an empty drop target),
 * lets the user upload a replacement, and lets them remove it.
 *
 * The upload is validated here as well as on the server, so an obviously
 * wrong file is rejected before it is sent. The server re-validates the
 * bytes regardless - this check is for the user's benefit, not for
 * security.
 */

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export function ImageField({ value, onChange, onUpload, id }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPEG, PNG, WebP and GIF images are supported.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Images must be 5 MB or smaller.')
      return
    }

    setError('')
    setBusy(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (uploadError) {
      setError(uploadError.message || 'That image could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  if (!value) {
    return (
      <div className="image-field">
        <button
          type="button"
          id={id}
          className="image-field__empty"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <UploadIcon size={18} />
          <span>{busy ? 'Uploading...' : 'Upload an image'}</span>
        </button>
        {error ? <p className="insp-error">{error}</p> : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          onChange={handleFile}
          hidden
        />
      </div>
    )
  }

  return (
    <div className="image-field">
      <div className="image-field__preview">
        <img src={assetUrl(value)} alt="" />
      </div>
      <div className="image-field__actions">
        <button type="button" className="insp-link-button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading...' : 'Replace'}
        </button>
        <button type="button" className="insp-link-button insp-link-button--danger" onClick={() => onChange('')}>
          Remove
        </button>
      </div>
      {error ? <p className="insp-error">{error}</p> : null}
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} onChange={handleFile} hidden />
    </div>
  )
}

/**
 * A small crop preview: shows how an image will be cropped at a given
 * aspect ratio and focus point, so the user can see the result before
 * choosing.
 */
export function CropPreview({ url, aspect = '1 / 1', objectPosition = '50% 50%', radius = 0 }) {
  if (!url) return null
  return (
    <div className="crop-preview">
      <div className="crop-preview__frame" style={{ aspectRatio: aspect, borderRadius: `${radius}px` }}>
        <img src={assetUrl(url)} alt="" style={{ objectPosition }} />
      </div>
      <p className="insp-help">This is how the image will be cropped.</p>
    </div>
  )
}

export { CloseIcon }
