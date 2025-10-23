# Defenra Core

Dashboard management system с MongoDB и NextAuth.

## Требования

- Node.js 18+
- MongoDB (локальная установка или удаленная база данных)

## Установка

1. Клонируйте репозиторий
2. Установите зависимости:

```bash
npm install
```

3. Скопируйте `.env.example` в `.env.local` и настройте переменные окружения:

```bash
cp .env.example .env.local
```

4. Отредактируйте `.env.local`:
   - `MONGODB_URI` - строка подключения к MongoDB
   - `NEXTAUTH_SECRET` - секретный ключ для NextAuth (сгенерируйте случайную строку)
   - `NEXTAUTH_URL` - URL вашего приложения

## Запуск проекта

### Режим разработки

```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

### Production build

```bash
npm run build
npm start
```

## Первоначальная настройка

При первом запуске с пустой базой данных:

1. Откройте [http://localhost:3000](http://localhost:3000)
2. Вы будете автоматически перенаправлены на страницу установки `/setup`
3. Создайте учетную запись администратора
4. После создания вы будете перенаправлены на страницу входа
5. Войдите с созданными учетными данными

## Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/ - NextAuth API routes
│   │   ├── setup/ - API для первоначальной настройки
│   │   └── user/profile/ - API для обновления профиля
│   ├── dashboard/ - Основные страницы dashboard
│   │   ├── layout.jsx - Layout с sidebar
│   │   ├── page.jsx - Главная страница dashboard
│   │   └── profile/ - Страница профиля
│   ├── login/ - Страница входа
│   ├── setup/ - Страница первоначальной настройки
│   └── layout.js - Корневой layout с SessionProvider
├── components/ - React компоненты
├── lib/
│   ├── auth.js - Настройка NextAuth
│   └── mongodb.js - Подключение к MongoDB
├── models/
│   └── User.js - Mongoose модель пользователя
└── middleware.js - Middleware для проверки установки и аутентификации

## Функционал

- ✅ Аутентификация через NextAuth
- ✅ MongoDB для хранения данных
- ✅ Первоначальная настройка системы
- ✅ Dashboard с sidebar навигацией
- ✅ Страница профиля с редактированием
- ✅ Управление пользователями
- ✅ Защита маршрутов через middleware

## Технологии

- Next.js 16
- NextAuth 5 (beta)
- MongoDB с Mongoose
- Tailwind CSS
- ShadCN UI компоненты
- Bcrypt для хеширования паролей
