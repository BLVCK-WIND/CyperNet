import { useEffect } from 'react';

/**
 * Hook to set document title with standardized prefix
 * Format: CyberNet • {title}
 */
export function useDocumentTitle(title: string, prefix: string = 'CyberNet') {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) {
      document.title = `${prefix} • ${title}`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, prefix]);
}

export default useDocumentTitle;
