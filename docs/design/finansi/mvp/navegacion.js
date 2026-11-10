import { t } from './idioma.js';

const groups = {
  principal: [
    ['inicio', 'home', 'm3 10 9-7 9 7v11H3z M9 21v-7h6v7'],
    ['productos', 'products', 'm3 7 9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4M12 11v10'],
    ['calculadora', 'calc', 'M5 3h14v18H5z M8 7h8 M8 11h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1m-9 3h1m3 0h1m3 0h1'],
    ['ventas', 'sales', 'M4 7h16l1 14H3z M8 9V7a4 4 0 1 1 8 0v2']
  ],
  tools: [['simulador', 'compare', 'M5 4v16h15 M9 16v-4m4 4V8m4 8V5']],
  business: [
    ['inventario', 'inventory', 'm12 3 9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5', true],
    ['mi-dinero', 'money', 'M20 8V5H6a3 3 0 0 0 0 6h15v8H6a3 3 0 0 1-3-3V8m18 5h-5a2 2 0 0 0 0 4h5', true],
    ['diagnostico', 'diagnosis', 'M3 12h4l3-7 4 14 3-7h4', true],
    ['asistente', 'assistant', 'M10 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8zm9 12v6m-3-3h6', true]
  ],
  settings: [['configuracion', 'settings', 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6']],
  examples: [['pantallas', 'screens', 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z']]
};

function icon(path) {
  return '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
    'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
}

export function mountNavigation() {
  const header = document.querySelector('[data-shared-header]');
  const bottom = document.querySelector('[data-shared-bottom]');
  if (!header || !bottom) return;
  const page = document.body.dataset.page;
  const current = page === 'crear-producto' ? 'productos' : page;
  const secondary = Object.entries(groups).filter(([name]) => name !== 'principal');
  const label = (key) => '<span data-i18n="nav.' + key + '">' + t('nav.' + key) + '</span>';
  const links = (items) => items.map(([route, key, path, demo]) => {
    const selected = route === current ? ' aria-current="' + (route === page ? 'page' : 'location') + '"' : '';
    return '<a href="' + route + '.html" data-destination="' + route + '"' + selected + '>' +
      icon(path) + label(key) + (demo ? '<small data-i18n="nav.demo">Demo</small>' : '') + '</a>';
  });
  const sections = (entries) => entries.map(([name, items]) =>
    '<div class="app-nav-group"><p>' + label(name) + '</p><ul>' +
    links(items).map((link) => '<li>' + link + '</li>').join('') + '</ul></div>').join('');
  const sidebar = document.createElement('nav');
  sidebar.className = 'app-sidebar';
  sidebar.dataset.i18nAriaLabel = 'nav.primary';
  sidebar.innerHTML = sections(Object.entries(groups));
  header.after(sidebar);
  header.className = 'demo-header';
  header.innerHTML = '<div class="demo-header-inner"><a class="brand" href="inicio.html">' +
    '<img src="../prototipo/img/marca.svg" width="34" height="34" alt=""><span>Finansi</span></a>' +
    '<div class="demo-header-tools"><span class="profile-name" data-i18n="business.default"></span></div></div>';
  bottom.className = 'demo-bottom app-bottom';
  bottom.dataset.i18nAriaLabel = 'nav.mobile';
  bottom.innerHTML = links(groups.principal).join('') + '<button type="button" aria-haspopup="dialog" aria-controls="more-nav">' +
    icon('M4 12h1m6.5 0h1m6.5 0h1') + label('more') + '</button>';
  const button = bottom.querySelector('button');
  const activeSecondary = secondary.flatMap(([, items]) => items).find(([route]) => route === current);
  if (activeSecondary) {
    button.classList.add('more-active');
    button.setAttribute('aria-describedby', 'more-current');
    const description = document.createElement('span');
    description.id = 'more-current';
    description.className = 'sr-only';
    description.dataset.i18n = 'nav.' + activeSecondary[1];
    bottom.append(description);
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'more-nav';
  dialog.className = 'demo-dialog app-more';
  dialog.setAttribute('aria-labelledby', 'more-nav-title');
  dialog.innerHTML = '<div class="app-more-head"><h2 id="more-nav-title">' + label('more') + '</h2>' +
    '<form method="dialog"><button type="submit" class="action secondary" data-i18n="nav.close" autofocus></button></form></div>' +
    '<nav data-i18n-aria-label="nav.more">' + sections(secondary) + '</nav>';
  bottom.after(dialog);
  button.addEventListener('click', () => dialog.showModal());
  const desktop = matchMedia('(min-width: 1050px)');
  desktop.addEventListener('change', () => { if (desktop.matches) dialog.close(); });
  document.body.classList.add('app-shell');
}

export function linkPricingDraft(draftLink, draft, actions = {}) {
  for (const link of document.querySelectorAll('[data-destination="simulador"], [data-destination="calculadora"]')) {
    link.href = draftLink(link.dataset.destination + '.html', draft);
    const navigate = actions[link.dataset.destination];
    if (navigate) link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      // Cierra Más antes de validar para que el campo con error pueda recibir el foco.
      link.closest('dialog')?.close();
      navigate();
    });
  }
}
