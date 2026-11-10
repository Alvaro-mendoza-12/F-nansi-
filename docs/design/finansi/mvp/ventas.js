import { collectSale, listProducts, listSales, recordSale } from './almacen.js';
import { addAmounts, formatMoney, InputError, money, priceResult, ratio, recipeCost } from './precios.js';
import { dateText, errorText, localize, numberText, t } from './idioma.js';
import { bindCurrencyLabels, showError, showMessage, values } from './ui.js';

function saleResult(sale) {
  const quantity = BigInt(sale.quantity);
  const price = money(sale.price, 'price', true);
  const cost = ratio(BigInt(sale.unitCost.numerator), BigInt(sale.unitCost.denominator));
  return { amount: price * quantity, gain: priceResult(cost, price, quantity).total };
}

function totals(records, currency) {
  let sold = 0n;
  let received = 0n;
  let gain = ratio(0n);
  for (const sale of records) {
    const result = saleResult(sale);
    sold += result.amount;
    if (sale.payment === 'paid') received += result.amount;
    gain = addAmounts(gain, result.gain);
  }
  return {
    sold: () => formatMoney(sold, currency), received: () => formatMoney(received, currency),
    pending: () => formatMoney(sold - received, currency), grossProfit: () => formatMoney(gain, currency)
  };
}

export async function mountDashboard(workspace) {
  const section = document.querySelector('[data-dashboard="real"]');
  const [records, products] = await Promise.all([listSales(workspace), listProducts(workspace)]);
  values(section, { ...totals(records, workspace.currency), products: () => numberText(products.length) });
  localize(section.querySelector('[data-business-title]'), () => workspace.name || t('business.default'));
  section.querySelector('[data-dashboard-empty]').hidden = records.length > 0;
  section.hidden = false;
}

export async function mountSales(workspace) {
  const section = document.querySelector('[data-real-sales]');
  const dialog = document.querySelector('[data-real-sale-dialog]');
  const form = dialog.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const opener = section.querySelector('[data-start-sale]');
  const create = section.querySelector('[data-create-for-sale]');
  const list = section.querySelector('[data-sale-list]');
  const template = section.querySelector('[data-sale-template]');
  const status = section.querySelector('[data-sales-status]');
  let products = [];
  bindCurrencyLabels(form, workspace.currency);

  async function refreshProducts() {
    products = await listProducts(workspace);
    opener.hidden = products.length === 0;
    create.hidden = products.length > 0;
  }

  async function render() {
    const records = await listSales(workspace);
    values(section, totals(records, workspace.currency));
    list.replaceChildren();
    section.querySelector('[data-sales-empty]').hidden = records.length > 0;
    for (const sale of records) {
      const row = template.content.firstElementChild.cloneNode(true);
      row.querySelector('[data-sold-name]').textContent = sale.name;
      localize(row.querySelector('[data-sold-date]'), () => dateText(sale.recordedAt));
      localize(row.querySelector('[data-sold-units]'), () => t('sale.units', { amount: numberText(BigInt(sale.quantity)) }));
      localize(row.querySelector('[data-sold-total]'), () => formatMoney(saleResult(sale).amount, sale.currency));
      const badge = row.querySelector('[data-payment]');
      const paid = sale.payment === 'paid';
      localize(badge, () => t(paid ? 'sale.paid' : 'sale.pending'));
      badge.classList.add(paid ? 'good' : 'warning');
      const collect = row.querySelector('[data-collect]');
      collect.hidden = paid;
      collect.addEventListener('click', async () => {
        collect.disabled = true;
        try {
          const updated = await collectSale(sale.id, workspace);
          await render();
          showMessage(status, () => t('sale.collected', { amount: formatMoney(saleResult(updated).amount, sale.currency) }));
          status.tabIndex = -1;
          status.focus();
        } catch (error) {
          showMessage(status, () => errorText(error));
          collect.disabled = false;
        }
      });
      list.append(row);
    }
  }

  function selectedProduct() {
    return products.find((product) => product.id === form.elements.productId.value);
  }

  function previewLoss() {
    const warning = form.querySelector('[data-sale-loss]');
    const product = selectedProduct();
    if (product) {
      const cost = recipeCost(product.recipe).unit;
      try {
        const price = money(form.elements.price.value, 'price', true);
        if (priceResult(cost, price).belowCost) {
          showMessage(warning, () => t('sale.loss', { cost: formatMoney(cost, product.currency) }));
          return;
        }
      } catch (error) {
        if (!(error instanceof InputError)) throw error;
      }
    }
    showMessage(warning, '');
  }

  function fillPrice() {
    form.elements.price.value = selectedProduct()?.price ?? '';
    previewLoss();
  }

  opener.addEventListener('click', async () => {
    opener.disabled = true;
    try {
      await refreshProducts();
      if (!products.length) {
        showMessage(status, () => t('sale.needsProduct'));
        return;
      }
      form.reset();
      form.elements.productId.replaceChildren(...products.map((product) => new Option(product.name, product.id)));
      fillPrice();
      showError(form);
      dialog.showModal();
    } catch (error) {
      showMessage(status, () => errorText(error));
    } finally {
      opener.disabled = false;
    }
  });
  form.elements.productId.addEventListener('change', fillPrice);
  form.elements.price.addEventListener('input', previewLoss);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      const sale = await recordSale({
        ...Object.fromEntries(new FormData(form)), revision: selectedProduct()?.revision
      }, workspace);
      dialog.close();
      await render();
      showMessage(status, () => t(sale.payment === 'paid' ? 'sale.savedPaid' : 'sale.savedPending'));
    } catch (error) {
      showError(form, error, { focus: true });
    } finally {
      submit.disabled = false;
    }
  });
  await Promise.all([render(), refreshProducts()]);
  section.hidden = false;
}
