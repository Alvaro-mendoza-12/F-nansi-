import { collectSale, getBusiness, listProducts, listSales, recordSale } from './almacen.js';
import { addAmounts, formatMoney, money, priceResult, ratio } from './precios.js';
import { query, showError, showMessage, values } from './ui.js';

function saleResult(sale) {
  const quantity = BigInt(sale.quantity);
  const price = money(sale.price, 'price', 'el precio', true);
  const cost = ratio(BigInt(sale.unitCost.numerator), BigInt(sale.unitCost.denominator));
  return { amount: price * quantity, gain: priceResult(cost, price, quantity).total };
}

function totals(records) {
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
    sold: formatMoney(sold), received: formatMoney(received),
    pending: formatMoney(sold - received), grossProfit: formatMoney(gain)
  };
}

export async function mountDashboard() {
  if (query.get('modo') === 'ejemplo' || query.get('estado') === 'nuevo') {
    const selected = query.get('modo') === 'ejemplo' ? 'ejemplo' : 'nuevo';
    document.querySelector('[data-dashboard="' + selected + '"]').hidden = false;
    return;
  }
  const section = document.querySelector('[data-dashboard="real"]');
  const [records, products, business] = await Promise.all([listSales(), listProducts(), getBusiness()]);
  values(section, { ...totals(records), products: String(products.length) });
  section.querySelector('[data-business-title]').textContent = business || 'Mi taller';
  section.querySelector('[data-dashboard-empty]').hidden = records.length > 0;
  section.hidden = false;
}

const dateLabel = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

export async function mountSales() {
  if (query.get('modo') === 'ejemplo') {
    document.querySelector('[data-example-sales]').hidden = false;
    return;
  }
  const section = document.querySelector('[data-real-sales]');
  const dialog = document.querySelector('[data-real-sale-dialog]');
  const form = dialog.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const opener = section.querySelector('[data-start-sale]');
  const list = section.querySelector('[data-sale-list]');
  const template = section.querySelector('[data-sale-template]');
  const status = section.querySelector('[data-sales-status]');
  let products = [];

  async function render() {
    const records = await listSales();
    values(section, totals(records));
    list.replaceChildren();
    section.querySelector('[data-sales-empty]').hidden = records.length > 0;
    for (const sale of records) {
      const row = template.content.firstElementChild.cloneNode(true);
      row.querySelector('[data-sold-name]').textContent = sale.name;
      row.querySelector('[data-sold-date]').textContent = dateLabel.format(new Date(sale.recordedAt));
      row.querySelector('[data-sold-units]').textContent = sale.quantity + ' unid.';
      row.querySelector('[data-sold-total]').textContent = formatMoney(saleResult(sale).amount);
      const badge = row.querySelector('[data-payment]');
      const paid = sale.payment === 'paid';
      badge.textContent = paid ? 'Cobrada' : 'Por cobrar';
      badge.classList.add(paid ? 'good' : 'warning');
      const collect = row.querySelector('[data-collect]');
      collect.hidden = paid;
      collect.addEventListener('click', async () => {
        collect.disabled = true;
        try {
          const updated = await collectSale(sale.id);
          await render();
          showMessage(status, 'Registraste un cobro de ' + formatMoney(saleResult(updated).amount) + '.');
        } catch (error) {
          showMessage(status, error.message);
          collect.disabled = false;
        }
      });
      list.append(row);
    }
  }

  function fillPrice() {
    form.elements.price.value = products.find((product) => product.id === form.elements.productId.value)?.price ?? '';
  }

  opener.addEventListener('click', async () => {
    opener.disabled = true;
    try {
      products = await listProducts();
      if (!products.length) {
        showMessage(status, 'Guarda un producto en el catálogo para registrar una venta.');
        return;
      }
      form.reset();
      form.elements.productId.replaceChildren(...products.map((product) => new Option(product.name, product.id)));
      fillPrice();
      showError(form);
      dialog.showModal();
    } catch (error) {
      showMessage(status, error.message);
    } finally {
      opener.disabled = false;
    }
  });
  form.elements.productId.addEventListener('change', fillPrice);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    try {
      const sale = await recordSale(Object.fromEntries(new FormData(form)));
      dialog.close();
      await render();
      showMessage(status, sale.payment === 'paid' ? 'Venta y cobro registrados.' : 'Venta pendiente de cobro registrada.');
    } catch (error) {
      showError(form, error, { focus: true });
    } finally {
      submit.disabled = false;
    }
  });
  await render();
  section.hidden = false;
}
