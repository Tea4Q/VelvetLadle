// CORS Proxy Configuration for Recipe Extraction

export class CorsProxyService {
  // List of free CORS proxy services (use with caution in production)
  private static readonly CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
  ];

  static async fetchWithCorsProxy(url: string): Promise<Response> {
    console.log('Attempting to fetch with CORS proxy...');
    
    // Try direct fetch first (works on mobile/native)
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      if (response.ok) {
        console.log('Direct fetch successful');
        return response;
      }
    } catch {
      console.log('Direct fetch failed, trying CORS proxy...');
    }

    // Try CORS proxies if direct fetch fails
    for (const proxy of this.CORS_PROXIES) {
      try {
        console.log(`Trying proxy: ${proxy}`);
        const proxiedUrl = proxy + encodeURIComponent(url);
        
        const response = await fetch(proxiedUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (response.ok) {
          console.log(`Success with proxy: ${proxy}`);
          return response;
        }
      } catch (proxyError) {
        console.log(`Proxy ${proxy} failed:`, proxyError);
        continue;
      }
    }

    throw new Error('All CORS proxy attempts failed');
  }

  static getRecommendedAlternatives(): string[] {
    return [
      'Copy recipe text manually and paste into the app',
      'Use the "Open in Browser" button to view the recipe',
      'Try recipe URLs from sites with better CORS support',
      'Use mobile app instead of web browser (native apps don\'t have CORS restrictions)'
    ];
  }

  static isCorsError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('cors') || 
           errorMessage.includes('cross-origin') || 
           errorMessage.includes('same origin policy') ||
           errorMessage.includes('access-control-allow-origin');
  }
}
