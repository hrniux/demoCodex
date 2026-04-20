(function initMenuUrlState(factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined') {
    window.DemoCodexMenuUrlState = api;
  }
})(function createMenuUrlStateApi() {
  const QUERY_LIMIT = 80;

  function normalizeMenuQuery(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, QUERY_LIMIT);
  }

  function sanitizeMenuView(state, options = {}) {
    const defaultCategory = options.defaultCategory || 'all';
    const defaultSort = options.defaultSort || 'recommended';
    const allowedCategories = new Set(options.allowedCategories || [defaultCategory]);
    const allowedSorts = new Set(options.allowedSorts || [defaultSort]);
    const allowedSpotlights = new Set(options.allowedSpotlights || []);

    const category = allowedCategories.has(state.category) ? state.category : defaultCategory;
    const sort = allowedSorts.has(state.sort) ? state.sort : defaultSort;
    const query = normalizeMenuQuery(state.query);
    const spotlightHref =
      typeof state.spotlightHref === 'string' && allowedSpotlights.has(state.spotlightHref)
        ? state.spotlightHref
        : null;

    return {
      query,
      category,
      sort,
      spotlightHref,
    };
  }

  function parseMenuViewFromSearch(search, options = {}) {
    const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));

    return sanitizeMenuView(
      {
        query: params.get('q') || '',
        category: params.get('category') || options.defaultCategory || 'all',
        sort: params.get('sort') || options.defaultSort || 'recommended',
        spotlightHref: params.get('spotlight'),
      },
      options,
    );
  }

  function buildMenuViewSearch(state, options = {}) {
    const sanitized = sanitizeMenuView(state, options);
    const params = new URLSearchParams();
    const defaultCategory = options.defaultCategory || 'all';
    const defaultSort = options.defaultSort || 'recommended';

    if (sanitized.query) {
      params.set('q', sanitized.query);
    }

    if (sanitized.category !== defaultCategory) {
      params.set('category', sanitized.category);
    }

    if (sanitized.sort !== defaultSort) {
      params.set('sort', sanitized.sort);
    }

    if (sanitized.spotlightHref) {
      params.set('spotlight', sanitized.spotlightHref);
    }

    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
  }

  return {
    QUERY_LIMIT,
    normalizeMenuQuery,
    sanitizeMenuView,
    parseMenuViewFromSearch,
    buildMenuViewSearch,
  };
});
