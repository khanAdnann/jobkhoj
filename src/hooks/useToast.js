import { useContext } from 'react'
import { ToastContext } from '@/context/toastContext'

/**
 * Access the toast API.
 *
 *   const toast = useToast()
 *   toast.success('Saved')
 *   toast.error('Upload failed')
 */
export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast() must be called inside <ToastProvider>')
  }

  return context
}

export default useToast
