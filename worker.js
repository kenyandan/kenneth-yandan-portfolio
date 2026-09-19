// Redirects http -> https and www.kennethyandan.com -> kennethyandan.com, then serves the static site.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isProd = url.hostname === 'kennethyandan.com' || url.hostname === 'www.kennethyandan.com';
    if (isProd && (url.hostname === 'www.kennethyandan.com' || url.protocol === 'http:')) {
      url.hostname = 'kennethyandan.com';
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
