import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
      return (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
          <h2>Ocurrió un error inesperado al procesar la pantalla.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Intentá refrescar la página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#009292', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Refrescar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
