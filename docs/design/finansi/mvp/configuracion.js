import { readData, restoreData, saveBusiness } from './almacen.js';
import { createBackup, parseBackup } from './respaldo.js';
import { errorText, localize, numberText, setBusinessLocale, t } from './idioma.js';
import { fillCountrySelect, pricingExample, showError, showMessage } from './ui.js';
import { appearance, preferredMethod, saveAppearance, savePreferredMethod } from './preferencias.js';

export function mountSettings(initial, updateProfile) {
  let workspace = initial;
  const section = document.querySelector('[data-settings]');
  const form = section.querySelector('[data-business-form]');
  const save = form.querySelector('[type="submit"]');
  const status = section.querySelector('[data-settings-status]');
  const backupError = section.querySelector('[data-backup-error]');
  const exportButton = section.querySelector('[data-export]');
  const importButton = section.querySelector('[data-import]');
  const input = section.querySelector('[data-import-file]');
  const dialog = document.querySelector('[data-restore-dialog]');
  const restoreForm = dialog.querySelector('form');
  const replace = restoreForm.querySelector('[type="submit"]');
  let pending = null;

  const preferences = section.querySelector('[data-preferences]');
  for (const [name, read, write] of [
    ['method', preferredMethod, savePreferredMethod], ['appearance', appearance, saveAppearance]
  ]) {
    const select = preferences.elements[name];
    select.value = read();
    select.addEventListener('change', () => {
      showError(preferences);
      showMessage(status, '');
      try {
        write(select.value);
        showMessage(status, () => t('settings.saved'));
      } catch (error) {
        select.value = read();
        showError(preferences, error);
      }
    });
  }

  function display(profile) {
    workspace = profile;
    setBusinessLocale(profile);
    updateProfile(profile);
    form.elements.business.value = profile.name;
    fillCountrySelect(form.elements.country, profile);
    for (const example of preferences.querySelectorAll('[data-pricing-example]')) {
      localize(example, () => pricingExample(example.dataset.pricingExample, profile.currency));
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (save.disabled) return;
    save.disabled = true;
    showError(form);
    showMessage(status, '');
    try {
      const updated = await saveBusiness({
        name: form.elements.business.value.trim(), activity: workspace.activity,
        country: form.elements.country.value
      }, workspace);
      display(updated);
      showMessage(status, () => t('settings.saved'));
    } catch (error) {
      showError(form, error, { focus: true });
    } finally {
      save.disabled = false;
    }
  });

  exportButton.addEventListener('click', async () => {
    exportButton.disabled = true;
    showMessage(backupError, '');
    showMessage(status, '');
    try {
      const backup = createBackup(await readData(workspace));
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const address = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = address;
      link.download = 'finansi-' + backup.business.currency + '-' + backup.exportedAt.slice(0, 10) + '.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(address), 1000);
      showMessage(status, () => t('settings.exported'));
    } catch (error) {
      showMessage(backupError, () => errorText(error));
    } finally {
      exportButton.disabled = false;
    }
  });

  importButton.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    importButton.disabled = true;
    showMessage(backupError, '');
    showMessage(status, '');
    try {
      const backup = parseBackup(await file.text());
      pending = { backup, expected: workspace };
      const currentCurrency = workspace.currency;
      showMessage(dialog.querySelector('[data-restore-summary]'), () => t('settings.preview', {
        products: numberText(backup.products.length), sales: numberText(backup.sales.length),
        currency: backup.business.currency
      }));
      showMessage(dialog.querySelector('[data-restore-currency]'), backup.business.currency !== currentCurrency
        ? () => t('settings.restoreCurrency', { current: currentCurrency, incoming: backup.business.currency }) : '');
      showError(restoreForm);
      dialog.showModal();
    } catch (error) {
      showMessage(backupError, () => errorText(error));
    } finally {
      importButton.disabled = false;
    }
  });

  dialog.addEventListener('close', () => {
    pending = null;
    importButton.focus();
  });
  dialog.addEventListener('cancel', (event) => {
    if (replace.disabled) event.preventDefault();
  });
  restoreForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pending || replace.disabled) return;
    replace.disabled = true;
    const cancel = dialog.querySelector('[data-close-dialog]');
    cancel.disabled = true;
    try {
      const restored = await restoreData(pending.backup, pending.expected);
      display(restored);
      showMessage(status, () => t('settings.restored', { currency: restored.currency }));
      dialog.close();
    } catch (error) {
      showError(restoreForm, error, { focus: true });
    } finally {
      replace.disabled = false;
      cancel.disabled = false;
    }
  });

  display(workspace);
  section.hidden = false;
}
