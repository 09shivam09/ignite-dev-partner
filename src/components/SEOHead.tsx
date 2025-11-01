import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

export const SEOHead = ({ 
  title = 'EVENT-CONNECT - Find Local Event Services',
  description = 'Connect with top-rated event service providers. Discover catering, photography, venues, and more for your perfect event.',
  image = 'https://lovable.dev/opengraph-image-p98pqg.png',
  type = 'website'
}: SEOHeadProps) => {
  const location = useLocation();
  
  useEffect(() => {
    // Update title
    document.title = title;
    
    // Update meta tags
    const updateMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
      }
      if (element) {
        element.content = content;
      }
    };
    
    updateMetaTag('description', description);
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:type', type);
    updateMetaTag('og:url', window.location.href);
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
  }, [title, description, image, type, location]);
  
  return null;
};
