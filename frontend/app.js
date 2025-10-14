// Frontend logic for menu, cart and order submission
const API = (typeof API_BASE !== 'undefined' && API_BASE && API_BASE !== 'PUT_YOUR_BACKEND_URL_HERE') ? API_BASE : '';

const state = { menu: null, cart: [] };

function fmtPrice(p){ return p + ' грн'; }

async function loadMenu(){
  setStatus('Завантаження меню...');
  try{
    const url = (API ? API : '') + '/api/menu';
    const res = await fetch(url);
    const data = await res.json();
    state.menu = data;
    renderMenu();
    setStatus('');
  } catch(e){
    console.error(e);
    setStatus('Не вдалося отримати меню. Показано приклад.');
    state.menu = { categories:[{id:'sample',name:'Меню',items:[{id:'p1',name:'Піца тест',description:'Тестова позиція',price:120}]}] };
    renderMenu();
  }
}

function setStatus(t){ document.getElementById('status').innerText = t; }

function renderMenu(){
  const col = document.getElementById('menu-column');
  col.innerHTML = '';
  state.menu.categories.forEach(cat=>{
    const box = document.createElement('div'); box.className='menu-cat card';
    const h = document.createElement('h2'); h.innerText = cat.name; box.appendChild(h);
    cat.items.forEach(it=>{
      const itEl = document.createElement('div'); itEl.className='item';
      const left = document.createElement('div'); left.className='left';
      const title = document.createElement('div'); title.className='title'; title.innerText = it.name;
      const desc = document.createElement('div'); desc.className='desc'; desc.innerText = it.description || '';
      left.appendChild(title); left.appendChild(desc);
      const right = document.createElement('div'); right.style.textAlign='right';
      const price = document.createElement('div'); price.className='price'; price.innerText = fmtPrice(it.price);
      const btn = document.createElement('button'); btn.className='btn'; btn.innerText='Додати'; btn.addEventListener('click', ()=>addToCart(it));
      right.appendChild(price); right.appendChild(btn);
      itEl.appendChild(left); itEl.appendChild(right);
      box.appendChild(itEl);
    });
    col.appendChild(box);
  });
}

function addToCart(item){
  const existing = state.cart.find(c=>c.id===item.id);
  if(existing) existing.qty += 1; else state.cart.push({ id:item.id, name:item.name, price:item.price, qty:1 });
  renderCart();
}

function renderCart(){
  const list = document.getElementById('cart-list'); list.innerHTML='';
  if(state.cart.length===0){ list.innerHTML='<div class="muted">Кошик порожній</div>'; }
  else{
    state.cart.forEach(ci=>{
      const div = document.createElement('div'); div.className='cart-item';
      div.innerHTML = `<div>${ci.name} × ${ci.qty}</div><div class="controls"><span>${ci.price*ci.qty} грн</span><button data-id="${ci.id}" class="inc">+</button><button data-id="${ci.id}" class="dec">-</button></div>`;
      list.appendChild(div);
    });
    document.querySelectorAll('.inc').forEach(b=>b.addEventListener('click', ()=>{ changeQty(b.getAttribute('data-id'),1); }));
    document.querySelectorAll('.dec').forEach(b=>b.addEventListener('click', ()=>{ changeQty(b.getAttribute('data-id'),-1); }));
  }
  document.getElementById('cart-count').innerText = '🛒 ' + state.cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('total').innerText = state.cart.reduce((s,i)=>s + i.price*i.qty,0) + ' грн';
}

function changeQty(id,delta){
  state.cart = state.cart.map(c=> c.id===id ? {...c, qty: Math.max(0, c.qty+delta)} : c ).filter(c=>c.qty>0);
  renderCart();
}

document.addEventListener('click', async (e)=>{
  if(e.target && e.target.id === 'confirm-btn'){
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    if(!name || !phone || state.cart.length===0){ document.getElementById('feedback').innerText = 'Заповніть ім\'я, телефон та додайте товари в кошик'; return; }
    const total = state.cart.reduce((s,i)=>s + i.price*i.qty,0);
    const payload = { customer:{name,phone,address}, items: state.cart, total };
    try{
      const res = await fetch((API ? API : '') + '/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      if(data.ok){
        document.getElementById('feedback').innerHTML = '<div style="color:#4ade80;font-weight:700">Дякуємо! З вами зв\'яжеться адміністратор для уточнення замовлення.</div>';
        state.cart = []; renderCart();
        document.getElementById('name').value=''; document.getElementById('phone').value=''; document.getElementById('address').value='';
      } else {
        document.getElementById('feedback').innerText = 'Помилка при оформленні. Спробуйте пізніше.';
      }
    }catch(err){
      console.error(err); document.getElementById('feedback').innerText = 'Помилка сервера.';
    }
  }
});

window.addEventListener('load', ()=>{ loadMenu(); renderCart(); });