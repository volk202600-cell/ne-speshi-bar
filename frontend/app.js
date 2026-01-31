/* ===== LOAD MENU ===== */
async function loadMenu(){
  const res = await fetch('menu.json');
  return res.json();
}

/* ===== STATE ===== */
const state = {
  menu: [],
  cart: []
};

/* ===== HELPERS ===== */
function price(p){ return `${p} ₴`; }

/* ===== CARD ===== */
function cardFor(it){
  const div = document.createElement('div');
  div.className = 'card';

  const img = document.createElement('img');
  img.src = it.photo;
  img.alt = it.name;
  img.onclick = () => openImg(it.photo);

  const title = document.createElement('div');
  title.className = 'title';
  title.innerText = it.name;

  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.innerText = it.description || '';

  const priceEl = document.createElement('div');
  priceEl.className = 'price';
  priceEl.innerText = price(it.price || 0);

  const btn = document.createElement('button');
  btn.className = 'btn primary add-to-cart';
  btn.innerText = 'Додати';
  btn.onclick = () => addToCart(it);

  div.append(img, title, desc, priceEl, btn);
  return div;
}

/* ===== RENDER ===== */
function renderCatalog(menu){
  const c = document.getElementById('catalog');
  c.innerHTML = '';
  menu.forEach(it => c.appendChild(cardFor(it)));
}

function renderCart(){
  const el = document.getElementById('cart-contents');
  el.innerHTML = '';

  if(state.cart.length === 0){
    el.innerHTML = '<div class="muted">Кошик порожній</div>';
    updateTotals();
    return;
  }

  state.cart.forEach(ci => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>${ci.name} × ${ci.qty}</div>
      <div>
        ${price(ci.price * ci.qty)}
        <button class="inc">+</button>
        <button class="dec">-</button>
      </div>
    `;
    row.querySelector('.inc').onclick = () => changeQty(ci.name, 1);
    row.querySelector('.dec').onclick = () => changeQty(ci.name, -1);
    el.appendChild(row);
  });

  updateTotals();
}

function updateTotals(){
  const count = state.cart.reduce((s,i)=>s+i.qty,0);
  const sum = state.cart.reduce((s,i)=>s+i.qty*i.price,0);
  document.getElementById('cart-count').innerText = count;
  document.getElementById('cart-total').innerText = price(sum);
}

/* ===== CART LOGIC ===== */
function addToCart(it){
  const found = state.cart.find(x => x.name === it.name);
  if(found) found.qty++;
  else state.cart.push({ name: it.name, price: it.price, qty: 1 });
  saveCart();
  renderCart();
}

function changeQty(name, delta){
  state.cart = state.cart
    .map(i => i.name === name ? { ...i, qty: i.qty + delta } : i)
    .filter(i => i.qty > 0);
  saveCart();
  renderCart();
}

function saveCart(){
  localStorage.setItem('ns_cart', JSON.stringify(state.cart));
}

function loadCart(){
  const s = localStorage.getItem('ns_cart');
  if(s) state.cart = JSON.parse(s);
}

/* ===== UI ===== */
document.getElementById('open-cart').onclick = () => {
  document.getElementById('cart-drawer').classList.add('open');
  renderCart();
};

document.getElementById('close-cart').onclick = () => {
  document.getElementById('cart-drawer').classList.remove('open');
};

function openImg(src){
  if(!src) return;
  document.getElementById('img-modal-img').src = src;
  document.getElementById('img-modal').style.display = 'flex';
}

document.getElementById('img-modal-close').onclick = () => {
  document.getElementById('img-modal').style.display = 'none';
};

/* ===== CHECKOUT ===== */
document.getElementById('checkout').onclick = async () => {
  if(state.cart.length === 0){
    alert('Кошик порожній');
    return;
  }

  const name = prompt('Ваше імʼя');
  if(!name) return;

  const phone = prompt('Телефон');
  if(!phone) return;

  const address = prompt('Адреса доставки');
  if(!address) return;

  const comment = prompt('Коментар (необовʼязково)') || '—';

  const payment = confirm('OK = Онлайн (неактивно)\nCancel = Готівка')
    ? 'online'
    : 'cash';

  const payload = {
    customer: { name, phone, address, comment },
    items: state.cart,
    payment
  };

  try{
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if(j.ok){
      alert('Замовлення прийнято 👍');
      state.cart = [];
      saveCart();
      renderCart();
      document.getElementById('cart-drawer').classList.remove('open');
    } else {
      alert('Помилка відправки');
    }
  } catch(e){
    alert('Сервер недоступний');
  }
};

/* ===== INIT ===== */
window.onload = async () => {
  state.menu = await loadMenu();
  loadCart();
  renderCatalog(state.menu);
  renderCart();
};
