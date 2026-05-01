import { useNavigate } from '../hooks/useNavigate'
import styles from '../styles/InlineLink.module.css'

interface InlineLinkProps {
  to: string
  variant?: 'danger'
  children: string
}

export function InlineLink({ to, variant, children }: InlineLinkProps) {
  const navigate = useNavigate()

  return (
    <a
      href={to}
      className={`ca-fx-soft ${styles.link}${variant === 'danger' ? ` ${styles.danger}` : ''}`}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
