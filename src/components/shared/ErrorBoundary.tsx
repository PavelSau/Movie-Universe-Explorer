import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle size={28} className="text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="max-w-md text-muted-foreground">
              An unexpected error occurred while rendering this section. You can try
              reloading, or navigate back to the home page.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={this.handleReset}>
                Try again
              </Button>
              <Button variant="outline" onClick={() => window.location.assign('/')}>
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
