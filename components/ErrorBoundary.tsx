import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
    children: ReactNode;
    fallbackView?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallbackView || (
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper text-ink text-center">
                    <Icon name="lotus" className="w-16 h-16 text-primary animate-pulse mb-6" />
                    <h2 className="text-3xl font-serif font-bold mb-4">Something went wrong</h2>
                    <p className="text-stone-600 mb-8 max-w-md mx-auto">
                        The digital spiritual realm experienced a temporary instability.
                        Try reloading or returning to the home page.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="btn-primary"
                    >
                        Return to Sanctuary
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
