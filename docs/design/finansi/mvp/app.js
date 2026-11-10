import '../maqueta.js';
import { deleteProduct, getWorkspace, listProducts, saveBusiness } from './almacen.js';
import { mountSettings } from './configuracion.js';
import { localize, mountLanguage, setBusinessLocale, t } from './idioma.js';
import { mountNavigation } from './navegacion.js';
import { applyAppearance } from './preferencias.js';
import { formatMoney, money, priceResult, recipeCost, requiredName } from './precios.js';
import { mountComparison, mountPricing, mountRecipe } from './recetas.js';
import { fillCountrySelect, query, revealDraftProblem, showError, showMessage } from './ui.js';
import { mountDashboard, mountSales } from './ventas.js';

function mountOnboarding(workspace) {
  const form = document.querySelector('[data-onboarding]');
  const input = form.elements.business;
  const button = form.querySelector('[type="submit"]');
  input.value = workspace.name;
  if ([...form.elements.actividad.options].some((option) => option.value === workspace.activity)) {
    form.elements.actividad.value = workspace.activity;
  }
  fillCountrySelect(form.elements.country, workspace);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await saveBusiness({
        name: requiredName(input.value, 'business'), activity: form.elements.actividad.value,
        country: form.elements.country.value
      }, workspace);
      location.assign('crear-producto.html');
    } catch (error) {
      showError(form, error, { focus: true });
      button.disabled = false;
    }
  });
  input.disabled = false;
  button.disabled = false;
}

async function mountCatalog(workspace) {
  const toggle = document.querySelector('[data-catalog-switch]');
  if (query.get('modo') === 'ejemplo') {
    document.querySelector('[data-example-catalog]').hidden = false;
    document.querySelector('[data-saved-catalog]').hidden = true;
    localize(document.querySelector('[data-catalog-subtitle]'), () => t('catalog.example'));
    toggle.href = 'productos.html';
    localize(toggle, () => t('catalog.mine'));
    return;
  }

  const list = document.querySelector('[data-product-list]');
  const template = document.querySelector('[data-product-template]');
  const empty = document.querySelector('[data-catalog-empty]');
  const status = document.querySelector('[data-catalog-status]');
  const dialog = document.querySelector('[data-delete-dialog]');
  const deleteForm = dialog.querySelector('form');
  const confirm = deleteForm.querySelector('[type="submit"]');
  let selected;

  async function render() {
    const products = await listProducts(workspace);
    list.replaceChildren();
    empty.hidden = products.length > 0;
    for (const product of products) {
      const card = template.content.firstElementChild.cloneNode(true);
      const cost = recipeCost(product.recipe).unit;
      const result = priceResult(cost, money(product.price, 'price', true));
      card.dataset.productId = product.id;
      localize(card.querySelector('[data-category]'), () => product.category || t('catalog.savedProduct'));
      card.querySelector('[data-name]').textContent = product.name;
      localize(card.querySelector('[data-cost]'), () => formatMoney(cost, product.currency));
      localize(card.querySelector('[data-price]'), () => formatMoney(result.price, product.currency));
      localize(card.querySelector('[data-profit]'), () => formatMoney(result.profit, product.currency));
      const badge = card.querySelector('[data-price-status]');
      localize(badge, () => t(result.belowCost ? 'catalog.below' : 'catalog.saved'));
      badge.classList.toggle('warning', result.belowCost);
      const calculate = card.querySelector('[data-price-product]');
      calculate.href = 'calculadora.html?id=' + encodeURIComponent(product.id);
      localize(calculate, () => t('catalog.calculate', { name: product.name }), 'aria-label');
      const edit = card.querySelector('[data-open-product]');
      edit.href = 'crear-producto.html?id=' + encodeURIComponent(product.id);
      localize(edit, () => t('recipe.editProduct', { name: product.name }), 'aria-label');
      const remove = card.querySelector('[data-delete-product]');
      localize(remove, () => t('catalog.removeName', { name: product.name }), 'aria-label');
      remove.addEventListener('click', () => {
        selected = product;
        localize(dialog.querySelector('[data-delete-description]'),
          () => t('catalog.deletePrompt', { name: product.name }));
        showError(deleteForm);
        dialog.showModal();
      });
      list.append(card);
      if (product.id === query.get('guardado')) {
        showMessage(status, () => t('catalog.savedMessage', {
          name: product.name, price: formatMoney(result.price, product.currency)
        }));
      }
    }
  }

  deleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirm.disabled = true;
    try {
      await deleteProduct(selected, workspace);
      dialog.close();
      await render();
      showMessage(status, () => t('catalog.removed'));
      const heading = document.querySelector('main h1');
      heading.tabIndex = -1;
      heading.focus();
    } catch (error) {
      showError(deleteForm, error);
    } finally {
      confirm.disabled = false;
    }
  });
  await render();
}

const page = document.body.dataset.page;
const pages = {
  onboarding: mountOnboarding,
  'crear-producto': mountRecipe,
  calculadora: mountPricing,
  simulador: mountComparison,
  productos: mountCatalog,
  inicio: mountDashboard,
  ventas: mountSales,
  configuracion: mountSettings
};

function updateProfile(workspace) {
  const name = () => workspace.name || t('business.default');
  for (const element of document.querySelectorAll('.profile-name')) {
    localize(element, name);
  }
}

applyAppearance();
mountNavigation();
mountLanguage();
try {
  if (Object.hasOwn(pages, page)) {
    const workspace = await getWorkspace();
    setBusinessLocale(workspace);
    if (query.get('modo') !== 'ejemplo') updateProfile(workspace);
    await pages[page](workspace, updateProfile);
  }
} catch (error) {
  const form = document.querySelector('[data-onboarding]');
  if (form) showError(form, error);
  else revealDraftProblem(error);
}
