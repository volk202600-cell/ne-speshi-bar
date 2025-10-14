// Frontend logic: fetch /api/menu, render items, cart handling, submit order to /api/order
const apiBase = '';

const state = {
  menu: null,
  cart: []
};

function fmtPrice(p){ return p + ' грн'; }

async function loadMenu(){
  setStatus('Завантаження меню...');
  try {
    const res = await fetch('/api/menu');
    const data = await res.json();
    state.menu = data;
    renderMenu();
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus('Не вдалося завантажити меню. Показано приклад.');
    state.menu = { categories:[{id:'sample',name:'Меню',items:[{id:'p1',name:'Піца тест',description:'Тестова',price:120},{id:'d1',name:'Кола',description:'Напій',price:40}]}] };
    renderMenu();
  }
}

function setStatus(t){ document.getElementById('status').innerText = t; }

function renderMenu(){
  const col = document.getElementById('menu-column');
  col.innerHTML = '';
  state.menu.categories.forEach(cat=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<h2>${cat.name}</h2>`;
    cat.items.forEach(it=>{
      const itEl = document.createElement('div');
      itEl.className = 'item';
      itEl.innerHTML = `<div><div style="font-weight:600">${it.name}</div><div class="muted">${it.description||''}</div></div><div style="text-align:right"><div style="font-weight:600">${fmtPrice(it.price)}</div><button data-id="${it.id}">Додати</button></div>`;
      el.appendChild(itEl);
    });
    col.appendChild(el);
  });
  // attach buttons
  document.querySelectorAll('button[data-id]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = b.getAttribute('data-id');
      addToCartById(id);
    });
  });
}

function findItemById(id){
  for(const cat of state.menu.categories){
    const it = cat.items.find(x=>x.id===id);
    if(it) return it;
  }
  return null;
}

function addToCartById(id){
  const item = findItemById(id);
  if(!item) return;
  const existing = state.cart.find(c=>c.id===id);
  if(existing) existing.qty += 1;
  else state.cart.push({ id:item.id, name:item.name, price:item.price, qty:1 });
  renderCart();
}

function renderCart(){
  const list = document.getElementById('cart-list');
  list.innerHTML = '';
  if(state.cart.length===0){ list.innerHTML = '<div class="muted">Кошик порожній</div>'; }
  else {
    state.cart.forEach(ci=>{
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `<div>${ci.name} × ${ci.qty}</div><div><button class="dec" data-id="${ci.id}">-</button> <button class="inc" data-id="${ci.id}">+</button></div>`;
      list.appendChild(div);
    });
    document.querySelectorAll('button.inc').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-id'); changeQty(id,1);
    }));
    document.querySelectorAll('button.dec').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-id'); changeQty(id,-1);
    }));
  }
  const count = state.cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cart-count').innerText = '🛒 ' + count;
  const total = state.cart.reduce((s,i)=>s + i.price*i.qty, 0);
  document.getElementById('total').innerText = total + ' грн';
}

function changeQty(id,delta){
  state.cart = state.cart.map(c=>{
    if(c.id===id) return {...c, qty: Math.max(0, c.qty+delta)};
    return c;
  }).filter(c=>c.qty>0);
  renderCart();
}

document.getElementById('confirm-btn').addEventListener('click', async ()=>{
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  if(!name || !phone || state.cart.length===0){
    document.getElementById('feedback').innerText = 'Заповніть ім\'я, телефон та додайте товари в кошик';
    return;
  }
  const total = state.cart.reduce((s,i)=>s + i.price*i.qty, 0);
  const payload = { customer:{name,phone,address}, items: state.cart, total };
  try {
    const res = await fetch('/api/order',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if(data.ok){
      // show confirmation to customer
      document.getElementById('feedback').innerHTML = '<div class="success">Ваше замовлення прийняте. Дякуємо!</div>';
      // clear cart and inputs
      state.cart = [];
      renderCart();
      document.getElementById('name').value=''; document.getElementById('phone').value=''; document.getElementById('address').value='';
    } else {
      document.getElementById('feedback').innerText = 'Щось пішло не так. Спробуйте пізніше.';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('feedback').innerText = 'Помилка сервера. Перевірте консоль.';
  }
});

window.addEventListener('load', ()=>{ loadMenu(); renderCart(); });