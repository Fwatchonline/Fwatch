import { useEffect } from 'react';
import { SEOData } from '../types';

interface SEOProps extends SEOData {
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export function SEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  keywords = [],
  noIndex = false,
  jsonLd,
  breadcrumbs,
}: SEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title.includes('Tstream') ? title : `${title} | Tstream`;

    // Helper to update or create meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update standard meta
    setMeta('description', description);
    if (keywords.length > 0) {
      setMeta('keywords', keywords.join(', '));
    }
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // OpenGraph
    const resolvedUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', resolvedUrl, true);
    setMeta('og:site_name', 'Tstream', true);

    const defaultImage = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80';
    setMeta('og:image', ogImage || defaultImage, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage || defaultImage);

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', resolvedUrl);

    // Dynamic JSON-LD structured data script
    const structuredDataScripts: HTMLScriptElement[] = [];

    const schemasToInject: any[] = [];

    // Optional breadcrumb schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.item.startsWith('http') ? b.item : `${window.location.origin}${b.item}`,
        })),
      });
    }

    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        schemasToInject.push(...jsonLd);
      } else {
        schemasToInject.push(jsonLd);
      }
    }

    // Default WebSite schema if none provided
    if (schemasToInject.length === 0) {
      schemasToInject.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Tstream',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      });
    }

    // Clean existing dynamic JSON-LD
    const existing = document.querySelectorAll('script[data-fwatch-jsonld="true"]');
    existing.forEach((el) => el.remove());

    schemasToInject.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-fwatch-jsonld', 'true');
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
      structuredDataScripts.push(script);
    });

    return () => {
      structuredDataScripts.forEach((s) => s.remove());
    };
  }, [title, description, canonicalUrl, ogImage, ogType, keywords, noIndex, jsonLd, breadcrumbs]);

  return null;
}
