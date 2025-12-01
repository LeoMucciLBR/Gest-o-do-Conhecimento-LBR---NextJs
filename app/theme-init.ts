// Inline script to prevent theme flash - runs before React hydration
const initTheme = () => {
  try {
    // Check cookie first
    const cookieTheme = document.cookie
      .split('; ')
      .find(row => row.startsWith('theme='))
      ?.split('=')[1];
    
    // Check localStorage as fallback
    const storageTheme = localStorage.getItem('theme');
    
    // Check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Priority: cookie > localStorage > system preference
    const theme = cookieTheme || storageTheme || (systemPrefersDark ? 'dark' : 'light');
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    console.error('Theme initialization error:', e);
  }
};

initTheme();
