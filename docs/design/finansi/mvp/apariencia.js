import { localize, t } from './idioma.js';
import { appearance, applyAppearance, saveAppearance } from './preferencias.js';

export function mountAppearance() {
  const controls = document.querySelector('.display-controls');
  if (!controls) return;
  const group = document.createElement('div');
  group.className = 'theme-picker';
  group.setAttribute('role', 'group');
  group.dataset.i18nAriaLabel = 'theme.group';
  localize(group, () => t('theme.group'), 'aria-label');
  const paths = {
    light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    dark: '<path d="M20.9 13.3A9 9 0 0 1 10.7 3.1 9 9 0 1 0 20.9 13.3Z"/>'
  };
  for (const mode of ['light', 'dark']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.theme = mode;
    button.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[mode] + '</svg>';
    localize(button, () => t('theme.' + mode), 'aria-label');
    localize(button, () => t('theme.' + mode), 'title');
    button.addEventListener('click', () => {
      try { saveAppearance(mode); }
      catch (error) { localize(status, () => error.message); }
    });
    group.append(button);
  }
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  controls.append(group, status);
  const device = matchMedia('(prefers-color-scheme: dark)');
  function refresh() {
    const preference = appearance();
    const selected = preference === 'system' ? device.matches ? 'dark' : 'light' : preference;
    for (const button of group.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.theme === selected));
    for (const select of document.querySelectorAll('[data-preferences] [name="appearance"]')) select.value = preference;
  }
  window.addEventListener('finansi:appearance-change', refresh);
  window.addEventListener('storage', (event) => {
    if (event.key === 'finansi:appearance') applyAppearance();
  });
  device.addEventListener('change', refresh);
  refresh();
}
