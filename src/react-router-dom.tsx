import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext<{
  path: string;
  navigate: (to: string | number, options?: { state?: any }) => void;
} | null>(null);

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(window.location.pathname + window.location.search);

  const navigate = (to: string | number, options?: { state?: any }) => {
    if (typeof to === 'number') {
      window.history.go(to);
    } else {
      window.history.pushState(options?.state || {}, '', to);
      setPath(typeof to === 'string' ? to : String(to));
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigate must be used within BrowserRouter');
  }
  return context.navigate;
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useLocation must be used within BrowserRouter');
  }
  const pathname = context.path.split('?')[0];
  const search = context.path.includes('?') ? '?' + context.path.split('?')[1] : '';
  return { 
    pathname, 
    search, 
    state: window.history.state 
  } as any;
}

interface RouteProps {
  path: string;
  element: React.ReactNode;
}

export function Routes({ children }: { children: React.ReactNode }) {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('Routes must be used within BrowserRouter');
  }

  let match: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (match) return;

    if (React.isValidElement(child)) {
      const el = child as React.ReactElement<RouteProps>;
      const { path } = el.props;
      const currentPathname = context.path.split('?')[0].split('#')[0];
      if (path === '*' || path === currentPathname) {
        match = el.props.element;
      }
    }
  });

  return <>{match}</>;
}

export function Route({ path, element }: RouteProps) {
  return null;
}

