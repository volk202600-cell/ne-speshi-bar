async function loadMenu(){ const res = await fetch('menu.json'); return res.json(); }
const state={menu:null,cart:[]};
function fmt(p){return p+' ₴';}
function cardFor(it){
  const div=document.createElement('div');div.className='card';
  const img=document.createElement('img');img.src=it.photo;img.alt=it.name;img.onclick=()=>openImg(it.photo);
  const title=document.createElement('div');title.className='title';title.innerText=it.name;
  const desc=document.createElement('div');desc.className='desc';desc.innerText=it.description||'';
  const price=document.createElement('div');price.className='price';price.innerText=fmt(it.price||0);
  const controls=document.createElement('div');controls.className='controls';
  const add=document.createElement('button');add.className='btn primary';add.innerText='Додати';add.onclick=()=>addToCart(it);
  controls.appendChild(add);
  div.appendChild(img);div.appendChild(title);div.appendChild(desc);div.appendChild(price);div.appendChild(controls);
  return div;
}
function renderCatalog(menu){
  const c=document.getElementById('catalog');c.innerHTML='';
  menu.forEach(it=> c.appendChild(cardFor(it)));
}
function addToCart(it){ const f=state.cart.find(x=>x.productId===it.productId); if(f) f.qty+=1; else state.cart.push({...it,qty:1}); saveCart(); renderCart(); }
function renderCart(){ const el=document.getElementById('cart-contents'); el.innerHTML=''; if(state.cart.length===0){ el.innerHTML='<div class="muted">Кошик порожній</div>'; document.getElementById('cart-count').innerText=0; document.getElementById('cart-total').innerText='0 ₴'; return; } state.cart.forEach(ci=>{ const row=document.createElement('div'); row.className='cart-item'; row.innerHTML = `<div>${ci.name} × ${ci.qty}</div><div>${ci.price*ci.qty} ₴ <button class='inc'>+</button> <button class='dec'>-</button></div>`; el.appendChild(row); row.querySelector('.inc').onclick=()=>changeQty(ci.productId,1); row.querySelector('.dec').onclick=()=>changeQty(ci.productId,-1); }); document.getElementById('cart-count').innerText = state.cart.reduce((s,i)=>s+i.qty,0); document.getElementById('cart-total').innerText = state.cart.reduce((s,i)=>s + i.qty * (i.price||0),0) + ' ₴'; }
function changeQty(pid,delta){ state.cart = state.cart.map(c=> c.productId===pid? {...c,qty:Math.max(0,c.qty+delta)}:c).filter(c=>c.qty>0); saveCart(); renderCart(); }
function saveCart(){ localStorage.setItem('ns_cart', JSON.stringify(state.cart)); }
function loadCart(){ const s=localStorage.getItem('ns_cart'); if(s) state.cart = JSON.parse(s); }
document.getElementById('open-cart').addEventListener('click', ()=>{ document.getElementById('cart-drawer').classList.add('open'); renderCart(); });
document.getElementById('close-cart').addEventListener('click', ()=>{ document.getElementById('cart-drawer').classList.remove('open'); });
function openImg(src){ if(!src) return; document.getElementById('img-modal-img').src=src; document.getElementById('img-modal').style.display='flex'; }
document.getElementById('img-modal-close').addEventListener('click', ()=>{ document.getElementById('img-modal').style.display='none'; });
document.getElementById('checkout').addEventListener('click', async ()=>{ if(state.cart.length===0){ alert('Кошик порожній'); return; } const name=prompt('Ваше ім\'я'); if(!name) return; const phone=prompt('Телефон (наприклад +380...)'); if(!phone) return; const payment = confirm('Онлайн? OK=Онлайн (неактивно), Cancel=Готівка') ? 'online' : 'cash'; const payload={customer:{name,phone}, items: state.cart, payment_method: payment}; try{ const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }); const j = await res.json(); if(j.ok){ alert('Замовлення прийнято. З вами зв\'яжеться адміністратор.'); state.cart=[]; saveCart(); renderCart(); document.getElementById('cart-drawer').classList.remove('open'); } else alert('Помилка при відправці замовлення'); }catch(err){ console.error(err); alert('Не вдалося відправити замовлення. Перевір бекенд.'); } });
window.addEventListener('load', async ()=>{ const menu = await loadMenu(); state.menu = menu; loadCart(); renderCatalog(menu); renderCart(); });