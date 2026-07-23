import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional hook to forward caught errors to a reporting service (Sentry, etc.). */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Always log so failures are observable; forward to a consumer handler if given.
    console.error('[FormErrorBoundary]', error, info.componentStack)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Something went wrong rendering this form. Please refresh and try again.
        </div>
      )
    }
    return this.props.children
  }
}
