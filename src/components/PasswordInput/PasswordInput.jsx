import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Field } from '../AuthShell/AuthShell.jsx'
import './PasswordInput.css'

export default function PasswordInput({ id, label = 'Password', ...fieldProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <Field
      id={id}
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className="pwinput-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      {...fieldProps}
    />
  )
}
