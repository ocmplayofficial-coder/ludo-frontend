import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext<{
  path: string;
  navigate: (to: string | number) => void;
} | null>(null);

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = (to: string | number) => {
    if (typeof to === 'number') {
      window.history.go(to);
    } else {
      window.history.pushState({}, '', to);
      setPath(to);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
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
  return { pathname: context.path } as const;
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
      const { path } = child.props as RouteProps;
      if (path === '*' || path === context.path) {
        match = child.props.element;
      }
    }
  });

  return <>{match}</>;
}

export function Route({ path, element }: RouteProps) {
  return null;
}
