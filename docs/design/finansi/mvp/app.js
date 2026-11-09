import { deleteProduct, getBusiness, listProducts, saveBusiness } from './almacen.js';
import { formatMoney, money, priceResult, recipeCost } from './precios.js';
import { mountComparison, mountPricing, mountRecipe } from './recetas.js';
import { query, revealDraftProblem, showError, showMessage } from './ui.js';
import { mountDashboard, mountSales } from './ventas.js';

async function mountOnboarding() {
  const form = document.querySelector('[data-onboarding]');
  const input = form.elements.business;
  const button = form.querySelector('[type="submit"]');
  input.value = await getBusiness();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await saveBusiness(input.value, form.elements.actividad.value);
      location.assign('crear-producto.html');
    } catch (error) {
      showError(form, error, { focus: true });
      button.disabled = false;
    }
  });
  input.disabled = false;
  button.disabled = false;
}

async function mountCatalog() {
  const toggle = document.querySelector('[data-catalog-switch]');
  if (query.get('modo') === 'ejemplo') {
    document.querySelector('[data-example-catalog]').hidden = false;
    document.querySelector('[data-saved-catalog]').hidden = true;
    document.querySelector('[data-catalog-subtitle]').textContent = 'Catálogo ficticio de Taller Bruma.';
    toggle.href = 'productos.html';
    toggle.textContent = 'Ver mis productos';
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
    const products = await listProducts();
    list.replaceChildren();
    empty.hidden = products.length > 0;
    for (const product of products) {
      const card = template.content.firstElementChild.cloneNode(true);
      const cost = recipeCost(product.recipe).unit;
      const result = priceResult(cost, money(product.price, 'price', 'el precio', true));
      card.dataset.productId = product.id;
      card.querySelector('[data-category]').textContent = product.category || 'Producto guardado';
      card.querySelector('[data-name]').textContent = product.name;
      card.querySelector('[data-cost]').textContent = formatMoney(cost);
      card.querySelector('[data-price]').textContent = formatMoney(result.price);
      card.querySelector('[data-profit]').textContent = formatMoney(result.profit);
      const badge = card.querySelector('[data-price-status]');
      badge.textContent = result.belowCost ? 'Precio bajo el costo' : 'Guardado';
      badge.classList.toggle('warning', result.belowCost);
      const edit = card.querySelector('[data-open-product]');
      edit.href = 'crear-producto.html?id=' + encodeURIComponent(product.id);
      edit.setAttribute('aria-label', 'Editar receta de ' + product.name);
      const remove = card.querySelector('[data-delete-product]');
      remove.setAttribute('aria-label', 'Eliminar ' + product.name);
      remove.addEventListener('click', () => {
        selected = product;
        dialog.querySelector('[data-delete-description]').textContent =
          'Se eliminará «' + product.name + '» del catálogo de este navegador.';
        showError(deleteForm);
        dialog.showModal();
      });
      list.append(card);
      if (product.id === query.get('guardado')) {
        showMessage(status, 'Guardaste «' + product.name + '» a ' + formatMoney(result.price) + ' por unidad.');
      }
    }
  }

  deleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    confirm.disabled = true;
    try {
      await deleteProduct(selected);
      dialog.close();
      await render();
      showMessage(status, 'Producto eliminado del catálogo.');
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
  ventas: mountSales
};

try {
  if (pages[page]) await pages[page]();
} catch (error) {
  const form = document.querySelector('[data-onboarding]');
  if (form) showError(form, error);
  else revealDraftProblem(error);
}

// El encabezado muestra el negocio local en las pantallas de trabajo.
if (query.get('modo') !== 'ejemplo' && !['onboarding', 'index'].includes(page)) {
  let business = '';
  try { business = await getBusiness(); } catch { /* El formulario indica el error si requiere almacenamiento. */ }
  for (const element of document.querySelectorAll('.profile-name')) {
    element.textContent = business || 'Mi taller';
    element.closest('summary').setAttribute('aria-label', 'Menú de ' + (business || 'Mi taller'));
  }
  for (const element of document.querySelectorAll('.profile-menu .avatar')) {
    element.textContent = (business || 'Mi taller').split(/\s+/).slice(0, 2)
      .map((word) => word[0]).join('').toUpperCase();
  }
}
