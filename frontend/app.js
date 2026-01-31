async function loadMenu(){
  const res = await fetch('menu.json');
  return res.json();
}

const state={cart:[]};

function renderCatalog(menu){
  const c=document.getElementById('catalog');
  c.innerHTML='';
  menu.forEach(it=>{
    const d=document.createElement('div');
    d.className='card';

    const img=document.createElement('img');
    img.src=it.photo;
    img.onclick=()=>openImg(it.photo);

    const t=document.createElement('div');
    t.className='title';
    t.innerText=it.name;

    const p=document.createElement('div');
    p.className='price';
    p.innerText=it.price+' ₴';

    const b=document.createElement('button');
    b.className='btn primary';
    b.innerText='Додати';
    b.onclick=(e)=>addToCart(it,e.target);

    d.append(img,t,p,b);
    c.appendChild(d);
  });
}

function addToCart(it,btn){
  const f=state.cart.find(i=>i.name===it.name);
  if(f)f.qty++; else state.cart.push({...it,qty:1});
  renderCart();
  fly(btn);
}

function renderCart(){
  const el=document.getElementById('cart-contents');
  el.innerHTML='';
  let sum=0,count=0;
  state.cart.forEach(i=>{
    sum+=i.qty*i.price;
    count+=i.qty;
    el.innerHTML+=`<div class="cart-item">${i.name} × ${i.qty}<b>${i.qty*i.price} ₴</b></div>`;
  });
  document.getElementById('cart-count').innerText=count;
  document.getElementById('cart-total').innerText=sum+' ₴';
}

function fly(btn){
  const c=document.getElementById('open-cart').getBoundingClientRect();
  const r=btn.getBoundingClientRect();
  const d=document.createElement('div');
  d.className='fly-dot';
  d.style.left=r.left+'px';
  d.style.top=r.top+'px';
  document.body.appendChild(d);
  setTimeout(()=>{
    d.style.left=c.left+'px';
    d.style.top=c.top+'px';
    d.style.opacity='0';
  },10);
  setTimeout(()=>d.remove(),600);
}

document.getElementById('checkout').onclick=async()=>{
  if(!state.cart.length)return alert('Кошик порожній');

  const name=prompt('Ваше імʼя'); if(!name)return;
  const phone=prompt('Телефон'); if(!phone)return;
  const address=prompt('Адреса доставки'); if(!address)return;
  const comment=prompt('Коментар (необовʼязково)')||'—';
  const payment=confirm('OK — Онлайн (неактивно)\nCancel — Готівка')?'online':'cash';

  const payload={name,phone,address,comment,payment,items:state.cart};

  await fetch('/api/order',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });

  alert('Дякуємо! Замовлення прийняте.\nЗ вами звʼяжеться адміністратор.');
  state.cart=[];
  renderCart();
  document.getElementById('cart-drawer').classList.remove('open');
};

document.getElementById('open-cart').onclick=()=>document.getElementById('cart-drawer').classList.add('open');
document.getElementById('close-cart').onclick=()=>document.getElementById('cart-drawer').classList.remove('open');

function openImg(src){
  document.getElementById('img-modal-img').src=src;
  document.getElementById('img-modal').style.display='flex';
}
document.getElementById('img-modal-close').onclick=()=>document.getElementById('img-modal').style.display='none';

window.onload=async()=>{
  const menu=await loadMenu();
  renderCatalog(menu);
};
