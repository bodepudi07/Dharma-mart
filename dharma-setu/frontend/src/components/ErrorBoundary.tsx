import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
    children: ReactNode;
    fallbackView?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorCount: 0,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        console.error('Error message:', error.message);
        console.error('Component stack:', errorInfo.componentStack);
    }

    private handleRetry = () => {
        this.setState(prev => ({ hasError: false, error: undefined, errorCount: prev.errorCount + 1 }));
    };

    public render() {
        if (this.state.hasError) {
            return this.props.fallbackView || (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                    <Icon name="lotus" className="w-16 h-16 text-primary opacity-50 mb-6" />
                    <h2 className="text-2xl font-serif font-bold mb-3 text-ink">Something went wrong</h2>
                    <p className="text-stone-500 mb-6 max-w-md mx-auto">
                        We encountered an unexpected issue. Please try again or return to the home page.
                    </p>
                    {this.state.error && (
                        <pre className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-3 max-w-xl mx-auto text-left overflow-auto mb-4 max-h-48">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="flex gap-3">
                        {this.state.errorCount < 3 && (
                            <button
                                onClick={this.handleRetry}
                                className="btn-secondary text-sm"
                            >
                                <Icon name="refresh-cw" className="w-4 h-4" />
                                Try Again
                            </button>
                        )}
                        <button
                            onClick={() => { window.location.hash = 'home'; window.location.reload(); }}
                            className="btn-primary text-sm"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
