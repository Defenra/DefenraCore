# Техническое задание: Интеграция агентов с API

## Обзор
Агенты должны периодически отправлять данные о клиентах, статистике трафика и логах на DefenraCore через REST API.

## Аутентификация
```
Authorization: Bearer <session_token>
```

---

## 1. Отправка клиентов - POST /api/clients

### Когда отправлять
- При новом соединении
- Каждые 5 минут для активных клиентов

### Запрос
```json
{
  "ip": "185.142.123.45",
  "agentId": "MongoDB ObjectId",
  "userAgent": "Mozilla/5.0...",
  "country": "Germany",
  "city": "Berlin",
  "countryCode": "DE"
}
```

### Пример
```javascript
async function reportClient(clientInfo) {
  await fetch('/api/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ip: clientInfo.ip,
      agentId: config.agentId,
      userAgent: clientInfo.userAgent,
      country: clientInfo.geoip?.country,
      city: clientInfo.geoip?.city,
      countryCode: clientInfo.geoip?.countryCode
    })
  });
}
```

---

## 2. Отправка статистики - POST /api/statistics

### Когда отправлять
- Каждые 5 минут (агрегированные данные)

### Запрос
```json
{
  "agentId": "MongoDB ObjectId",
  "resourceType": "proxy",
  "resourceId": "MongoDB ObjectId прокси или домена",
  "inboundBytes": 524288000,
  "outboundBytes": 314572800,
  "requests": 1543,
  "responseTimeMs": 145,
  "errors": 3
}
```

### Поля
- **resourceType**: "proxy" или "domain"
- **resourceId**: MongoDB ObjectId прокси (из Proxy collection) или домена (из Domain collection)

### Пример
```javascript
// Статистика разделена по типам ресурсов
let proxyStats = {}; // { proxyId: { inbound, outbound, requests, ... } }
let domainStats = {}; // { domainId: { inbound, outbound, requests, ... } }

// Инициализация счетчиков для ресурса
function initStats(resourceId) {
  return {
    inboundBytes: 0,
    outboundBytes: 0,
    requests: 0,
    totalResponseTime: 0,
    errors: 0
  };
}

// Собирать статистику для прокси
proxyServer.on('connection', (conn, proxyId) => {
  if (!proxyStats[proxyId]) {
    proxyStats[proxyId] = initStats(proxyId);
  }
  
  conn.on('data', (direction, bytes) => {
    proxyStats[proxyId][`${direction}Bytes`] += bytes;
  });
  
  conn.on('request', (startTime) => {
    proxyStats[proxyId].requests++;
    proxyStats[proxyId].totalResponseTime += Date.now() - startTime;
  });
  
  conn.on('error', () => {
    proxyStats[proxyId].errors++;
  });
});

// Собирать статистику для доменов
domainServer.on('request', (req, res, domainId) => {
  if (!domainStats[domainId]) {
    domainStats[domainId] = initStats(domainId);
  }
  
  const startTime = Date.now();
  
  req.on('data', (chunk) => {
    domainStats[domainId].inboundBytes += chunk.length;
  });
  
  res.on('data', (chunk) => {
    domainStats[domainId].outboundBytes += chunk.length;
  });
  
  res.on('finish', () => {
    domainStats[domainId].requests++;
    domainStats[domainId].totalResponseTime += Date.now() - startTime;
  });
  
  res.on('error', () => {
    domainStats[domainId].errors++;
  });
});

// Отправлять статистику каждые 5 минут
setInterval(async () => {
  // Отправить статистику по прокси
  for (const [proxyId, stats] of Object.entries(proxyStats)) {
    if (stats.requests === 0) continue;
    
    await fetch('/api/statistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        agentId: config.agentId,
        resourceType: 'proxy',
        resourceId: proxyId,
        ...stats,
        responseTimeMs: Math.round(stats.totalResponseTime / stats.requests)
      })
    });
    
    proxyStats[proxyId] = initStats(proxyId);
  }
  
  // Отправить статистику по доменам
  for (const [domainId, stats] of Object.entries(domainStats)) {
    if (stats.requests === 0) continue;
    
    await fetch('/api/statistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        agentId: config.agentId,
        resourceType: 'domain',
        resourceId: domainId,
        ...stats,
        responseTimeMs: Math.round(stats.totalResponseTime / stats.requests)
      })
    });
    
    domainStats[domainId] = initStats(domainId);
  }
}, 5 * 60 * 1000);
```

---

## 3. Отправка логов - POST /api/logs

### Когда отправлять
- **error**: немедленно
- **warning/info**: батчами каждые 30 секунд

### Запрос
```json
{
  "agentId": "MongoDB ObjectId",
  "level": "error",
  "message": "Failed to connect to upstream",
  "details": "Connection timeout after 30s",
  "metadata": {
    "upstreamHost": "192.168.1.10",
    "retries": 3
  }
}
```

### Уровни
- **info**: новые соединения, успешные операции
- **warning**: высокая нагрузка, замедления
- **error**: сбои, таймауты, исключения

### Пример
```javascript
let logQueue = { info: [], warning: [], error: [] };

async function sendLog(level, message, details = '', metadata = {}) {
  const log = {
    agentId: config.agentId,
    level,
    message,
    details,
    metadata
  };

  // Ошибки отправляем немедленно
  if (level === 'error') {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(log)
    });
  } else {
    logQueue[level].push(log);
  }
}

// Батчинг каждые 30 секунд
setInterval(async () => {
  for (const level of ['info', 'warning']) {
    const batch = logQueue[level].splice(0, 100);
    for (const log of batch) {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(log)
      });
    }
  }
}, 30 * 1000);
```

---

## 4. Обработка ошибок

### Retry механизм
```javascript
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 500) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      return res;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### Локальное кэширование
- При сбое сохранять в SQLite/JSON
- Отправлять при восстановлении связи
- Лимит: 10000 записей

---

## 5. Конфигурация

```json
{
  "apiEndpoint": "https://your-server.com/api",
  "reportingIntervals": {
    "statistics": 300000,
    "logs": 30000
  },
  "batching": {
    "maxLogsPerBatch": 100,
    "maxRetries": 3
  },
  "localCache": {
    "enabled": true,
    "maxEntries": 10000
  }
}
```

---

## 6. Примеры событий

### Info
- Новое соединение
- Health check
- Обновление конфигурации

### Warning
- CPU/Memory > 80%
- Медленный ответ > 5s
- Rate limiting

### Error
- Сбой upstream
- Таймауты
- SSL/TLS ошибки
- Неперехваченные исключения

---

## Checklist

- [ ] Сбор клиентов
- [ ] Сбор статистики
- [ ] Система логирования
- [ ] Retry механизм
- [ ] Батчинг логов
- [ ] Локальное кэширование
- [ ] Unit тесты
- [ ] Интеграционные тесты
- [ ] Документация
