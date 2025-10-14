README — Як використовувати фронтенд

1) Відкрий файл config.js і встав свій backend URL у змінну API_BASE:
   const API_BASE = 'https://твій-backend-url.onrender.com';

2) Завантаж ці файли в папку /frontend у своєму GitHub репозиторії (через Upload files або GitHub Desktop).
   Файли: index.html, style.css, app.js, config.js, README.txt

3) Vercel автоматично задеплоїть фронтенд. Якщо фронтенд і бекенд на різних доменах, переконайся, що в config.js стоїть правильний API_BASE.

4) Тест: відкрий фронтенд URL, додай товар у кошик та натисни 'Підтвердити замовлення' — повідомлення прийде в Telegram (якщо backend має токен і chat_id).