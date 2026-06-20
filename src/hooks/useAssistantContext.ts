import { useLocation } from 'react-router-dom';

export type AssistantContext = 'dashboard' | 'analytics' | 'heatmap' | 'network' | 'general';

export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const path = location.pathname;

  if (path === '/') return 'dashboard';
  if (path.startsWith('/analytics')) return 'analytics';
  if (path.startsWith('/heatmap')) return 'heatmap';
  if (path.startsWith('/network')) return 'network';

  return 'general';
}

export default useAssistantContext;
