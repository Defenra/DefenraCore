# Техническое задание: Интеграция агентов с API для сбора метрик

## Обзор

Агенты уже используют систему поллинга к серверу. После каждого поллинга (с jitter 100-300мс) агент должен отправлять накопленные данные о клиентах, статистике трафика и логах.

## Аутентификация

**Использовать существующую систему авторизации агента. Ничего менять не нужно.**

---

## Интеграция в поллинг цикл

### Текущая схема работы агента:
1. Агент делает polling к `/api/agent/poll`
2. Получает команды/конфигурацию
3. Ждет с jitter 100-300мс
4. Повторяет цикл

### Новая схема (добавить в существующий код):
1. Агент делает polling к `/api/agent/poll`
2. Получает команды/конфигурацию
3. **[НОВОЕ]** Отправляет накопленные метрики (клиенты, статистику, логи)
4. Ждет с jitter 100-300мс
5. Повторяет цикл

---

## 1. Отправка информации о клиентах

### Endpoint
```
POST /api/clients
```

### Когда отправлять
- **После каждого успешного поллинга** (перед jitter)
- Отправлять только новые/обновленные клиенты с момента последней отправки

### Формат запроса

```json
{
  "ip": "185.142.123.45",
  "agentId": "ObjectId агента из MongoDB",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "country": "Germany",
  "city": "Berlin",
  "countryCode": "DE"
}
```

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `ip` | string | Да | IP адрес клиента |
| `agentId` | string | Да | MongoDB ObjectId агента |
| `userAgent` | string | Нет | User-Agent строка клиента |
| `country` | string | Нет | Название страны (из GeoIP) |
| `city` | string | Нет | Название города (из GeoIP) |
| `countryCode` | string | Нет | ISO код страны (DE, US, RU) |

### Пример интеграции (Go)

```go
package main

import (
	"bytes"
	"encoding/json"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// Структуры данных
type ClientInfo struct {
	IP          string `json:"ip"`
	AgentID     string `json:"agentId"`
	UserAgent   string `json:"userAgent"`
	Country     string `json:"country,omitempty"`
	City        string `json:"city,omitempty"`
	CountryCode string `json:"countryCode,omitempty"`
}

// Глобальные очереди с мьютексами
var (
	pendingClients []ClientInfo
	clientsMutex   sync.Mutex
)

// При новом соединении - добавить в очередь
func handleNewConnection(remoteAddr, userAgent string) {
	// Получить геолокацию
	geoData := lookupGeoIP(remoteAddr)
	
	clientsMutex.Lock()
	pendingClients = append(pendingClients, ClientInfo{
		IP:          remoteAddr,
		UserAgent:   userAgent,
		Country:     geoData.Country,
		City:        geoData.City,
		CountryCode: geoData.CountryCode,
	})
	clientsMutex.Unlock()
}

// Существующий поллинг цикл (МОДИФИЦИРОВАТЬ)
func pollingCycle(config *Config) {
	for {
		// 1. Существующий поллинг (БЕЗ ИЗМЕНЕНИЙ)
		pollReq := map[string]string{"agentId": config.AgentID}
		pollBody, _ := json.Marshal(pollReq)
		
		resp, err := http.Post(
			config.APIUrl+"/api/agent/poll",
			"application/json",
			bytes.NewBuffer(pollBody),
		)
		
		if err == nil && resp.StatusCode == 200 {
			// Обработка команд от сервера (СУЩЕСТВУЮЩАЯ ЛОГИКА)
			// processCommands(resp)
			
			// 2. НОВОЕ: Отправить накопленные данные о клиентах
			clientsMutex.Lock()
			if len(pendingClients) > 0 {
				clients := make([]ClientInfo, len(pendingClients))
				copy(clients, pendingClients)
				pendingClients = nil // Очистить
				clientsMutex.Unlock()
				
				sendClients(config, clients)
			} else {
				clientsMutex.Unlock()
			}
		}
		
		resp.Body.Close()
		
		// 3. Существующий jitter (БЕЗ ИЗМЕНЕНИЙ)
		jitter := time.Duration(100+rand.Intn(200)) * time.Millisecond
		time.Sleep(jitter)
	}
}

func sendClients(config *Config, clients []ClientInfo) {
	for _, client := range clients {
		client.AgentID = config.AgentID
		data, _ := json.Marshal(client)
		
		resp, err := http.Post(
			config.APIUrl+"/api/clients",
			"application/json",
			bytes.NewBuffer(data),
		)
		
		if err != nil || resp.StatusCode != 200 {
			// При ошибке - вернуть в очередь
			clientsMutex.Lock()
			pendingClients = append(pendingClients, client)
			clientsMutex.Unlock()
		}
		
		if resp != nil {
			resp.Body.Close()
		}
	}
}
```

### Ответ сервера

```json
{
  "client": {
    "id": "...",
    "ip": "185.142.123.45",
    "connections": 1,
    "lastSeen": "2025-10-28T00:00:00.000Z"
  }
}
```

---

## 2. Отправка статистики трафика

### Endpoint
```
POST /api/statistics
```

### Когда отправлять
- **После каждого поллинга** (перед jitter)
- Отправлять статистику за период с момента последней отправки
- Если трафика не было - не отправлять

### Формат запроса

```json
{
  "agentId": "ObjectId агента из MongoDB",
  "inboundBytes": 524288000,
  "outboundBytes": 314572800,
  "requests": 1543,
  "responseTimeMs": 145,
  "errors": 3
}
```

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `agentId` | string | Да | MongoDB ObjectId агента |
| `inboundBytes` | number | Да | Входящий трафик в байтах за период |
| `outboundBytes` | number | Да | Исходящий трафик в байтах за период |
| `requests` | number | Да | Количество обработанных запросов |
| `responseTimeMs` | number | Да | Среднее время ответа в миллисекундах |
| `errors` | number | Нет | Количество ошибок за период |

### Пример интеграции (Go)

```go
// Структура статистики
type ResourceStats struct {
	InboundBytes      int64
	OutboundBytes     int64
	Requests          int64
	TotalResponseTime int64
	Errors            int64
}

type StatisticsPayload struct {
	AgentID       string `json:"agentId"`
	ResourceType  string `json:"resourceType"`
	ResourceID    string `json:"resourceId"`
	InboundBytes  int64  `json:"inboundBytes"`
	OutboundBytes int64  `json:"outboundBytes"`
	Requests      int64  `json:"requests"`
	ResponseTimeMs int64 `json:"responseTimeMs"`
	Errors        int64  `json:"errors"`
}

// Глобальные счетчики
var (
	proxyStats  = make(map[string]*ResourceStats)
	domainStats = make(map[string]*ResourceStats)
	statsMutex  sync.RWMutex
)

// Сбор статистики для прокси
func trackProxyTraffic(proxyID string, inbound, outbound int64) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	
	proxyStats[proxyID].InboundBytes += inbound
	proxyStats[proxyID].OutboundBytes += outbound
}

func trackProxyRequest(proxyID string, responseTime time.Duration) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	
	proxyStats[proxyID].Requests++
	proxyStats[proxyID].TotalResponseTime += responseTime.Milliseconds()
}

func trackProxyError(proxyID string) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	
	proxyStats[proxyID].Errors++
}

// Аналогично для доменов
func trackDomainTraffic(domainID string, inbound, outbound int64) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if domainStats[domainID] == nil {
		domainStats[domainID] = &ResourceStats{}
	}
	
	domainStats[domainID].InboundBytes += inbound
	domainStats[domainID].OutboundBytes += outbound
}

// В поллинг цикле (добавить после отправки клиентов)
func sendStatistics(config *Config) {
	statsMutex.Lock()
	
	// Копируем данные для отправки
	proxyToSend := make(map[string]*ResourceStats)
	for k, v := range proxyStats {
		if v.Requests > 0 {
			proxyToSend[k] = v
			proxyStats[k] = &ResourceStats{} // Сброс
		}
	}
	
	domainToSend := make(map[string]*ResourceStats)
	for k, v := range domainStats {
		if v.Requests > 0 {
			domainToSend[k] = v
			domainStats[k] = &ResourceStats{} // Сброс
		}
	}
	
	statsMutex.Unlock()
	
	// Отправка прокси статистики
	for proxyID, stats := range proxyToSend {
		payload := StatisticsPayload{
			AgentID:       config.AgentID,
			ResourceType:  "proxy",
			ResourceID:    proxyID,
			InboundBytes:  stats.InboundBytes,
			OutboundBytes: stats.OutboundBytes,
			Requests:      stats.Requests,
			ResponseTimeMs: stats.TotalResponseTime / stats.Requests,
			Errors:        stats.Errors,
		}
		
		data, _ := json.Marshal(payload)
		resp, err := http.Post(
			config.APIUrl+"/api/statistics",
			"application/json",
			bytes.NewBuffer(data),
		)
		
		if err != nil || resp.StatusCode != 200 {
			// Вернуть в счетчики при ошибке
			statsMutex.Lock()
			if proxyStats[proxyID] == nil {
				proxyStats[proxyID] = &ResourceStats{}
			}
			proxyStats[proxyID].InboundBytes += stats.InboundBytes
			proxyStats[proxyID].OutboundBytes += stats.OutboundBytes
			proxyStats[proxyID].Requests += stats.Requests
			proxyStats[proxyID].TotalResponseTime += stats.TotalResponseTime
			proxyStats[proxyID].Errors += stats.Errors
			statsMutex.Unlock()
		}
		
		if resp != nil {
			resp.Body.Close()
		}
	}
	
	// Аналогично для доменов
	for domainID, stats := range domainToSend {
		payload := StatisticsPayload{
			AgentID:       config.AgentID,
			ResourceType:  "domain",
			ResourceID:    domainID,
			InboundBytes:  stats.InboundBytes,
			OutboundBytes: stats.OutboundBytes,
			Requests:      stats.Requests,
			ResponseTimeMs: stats.TotalResponseTime / stats.Requests,
			Errors:        stats.Errors,
		}
		
		data, _ := json.Marshal(payload)
		http.Post(config.APIUrl+"/api/statistics", "application/json", bytes.NewBuffer(data))
	}
}
```

### Ответ сервера

```json
{
  "stats": {
    "id": "...",
    "totalBytes": 838860800,
    "timestamp": "2025-10-28T00:00:00.000Z"
  }
}
```

---

## 3. Отправка логов

### Endpoint
```
POST /api/logs
```

### Когда отправлять
- **После каждого поллинга** (перед jitter)
- Отправлять все накопленные логи с момента последней отправки
- Лимит: до 100 логов за раз (если больше - отправить в следующий раз)

### Формат запроса

```json
{
  "agentId": "ObjectId агента из MongoDB",
  "level": "error",
  "message": "Failed to connect to upstream server",
  "details": "Connection timeout after 30s to 192.168.1.10:8080",
  "metadata": {
    "upstreamHost": "192.168.1.10",
    "upstreamPort": 8080,
    "retries": 3
  }
}
```

### Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `agentId` | string | Да | MongoDB ObjectId агента |
| `level` | string | Да | Уровень: `info`, `warning`, `error` |
| `message` | string | Да | Краткое сообщение (до 200 символов) |
| `details` | string | Нет | Подробная информация |
| `metadata` | object | Нет | Дополнительные данные (JSON) |

### Уровни логов

- **info**: Информационные сообщения (новое соединение, успешные операции)
- **warning**: Предупреждения (высокая нагрузка, замедление)
- **error**: Ошибки (сбой соединения, таймауты, исключения)

### Пример интеграции (Go)

```go
// Структура лога
type LogEntry struct {
	AgentID  string                 `json:"agentId"`
	Level    string                 `json:"level"`
	Message  string                 `json:"message"`
	Details  string                 `json:"details,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// Глобальная очередь логов
var (
	pendingLogs []LogEntry
	logsMutex   sync.Mutex
	maxLogs     = 500
)

// Функция добавления лога в очередь
func addLog(level, message, details string, metadata map[string]interface{}) {
	logsMutex.Lock()
	defer logsMutex.Unlock()
	
	pendingLogs = append(pendingLogs, LogEntry{
		Level:    level,
		Message:  message,
		Details:  details,
		Metadata: metadata,
	})
	
	// Ограничение размера очереди
	if len(pendingLogs) > maxLogs {
		pendingLogs = pendingLogs[1:] // Удалить самый старый
	}
}

// Использование в коде агента
func handleConnection(conn net.Conn) {
	addLog("info", 
		fmt.Sprintf("New connection from %s", conn.RemoteAddr()), 
		"TCP connection established", 
		nil,
	)
	
	// ... обработка соединения
}

func handleProxyError(err error, proxyID string) {
	addLog("error", 
		"Proxy connection failed", 
		err.Error(), 
		map[string]interface{}{
			"proxyID": proxyID,
			"code":    "CONNECTION_FAILED",
		},
	)
}

// В поллинг цикле (добавить после sendStatistics)
func sendLogs(config *Config) {
	logsMutex.Lock()
	
	// Берем до 100 логов за раз
	limit := 100
	if len(pendingLogs) < limit {
		limit = len(pendingLogs)
	}
	
	if limit == 0 {
		logsMutex.Unlock()
		return
	}
	
	logsToSend := make([]LogEntry, limit)
	copy(logsToSend, pendingLogs[:limit])
	pendingLogs = pendingLogs[limit:]
	
	logsMutex.Unlock()
	
	// Отправка логов
	for i, log := range logsToSend {
		log.AgentID = config.AgentID
		data, _ := json.Marshal(log)
		
		resp, err := http.Post(
			config.APIUrl+"/api/logs",
			"application/json",
			bytes.NewBuffer(data),
		)
		
		if err != nil || resp.StatusCode != 200 {
			// При ошибке - вернуть неотправленные логи в начало очереди
			logsMutex.Lock()
			pendingLogs = append(logsToSend[i:], pendingLogs...)
			logsMutex.Unlock()
			
			if resp != nil {
				resp.Body.Close()
			}
			break // Остановить отправку при первой ошибке
		}
		
		if resp != nil {
			resp.Body.Close()
		}
	}
}

// Обновленный поллинг цикл
func pollingCycle(config *Config) {
	for {
		// 1. Поллинг
		pollReq := map[string]string{"agentId": config.AgentID}
		pollBody, _ := json.Marshal(pollReq)
		
		resp, err := http.Post(
			config.APIUrl+"/api/agent/poll",
			"application/json",
			bytes.NewBuffer(pollBody),
		)
		
		if err == nil && resp.StatusCode == 200 {
			// Обработка команд (существующая логика)
			// processCommands(resp)
			
			// 2. Отправить клиентов
			clientsMutex.Lock()
			if len(pendingClients) > 0 {
				clients := make([]ClientInfo, len(pendingClients))
				copy(clients, pendingClients)
				pendingClients = nil
				clientsMutex.Unlock()
				sendClients(config, clients)
			} else {
				clientsMutex.Unlock()
			}
			
			// 3. Отправить статистику
			sendStatistics(config)
			
			// 4. Отправить логи
			sendLogs(config)
		} else if err != nil {
			addLog("error", "Polling failed", err.Error(), nil)
		}
		
		if resp != nil {
			resp.Body.Close()
		}
		
		// 5. Jitter
		jitter := time.Duration(100+rand.Intn(200)) * time.Millisecond
		time.Sleep(jitter)
	}
}
```

### Ответ сервера

```json
{
  "log": {
    "id": "...",
    "timestamp": "2025-10-28T00:00:00.000Z"
  }
}
```

---

## 4. Важные моменты реализации

### 4.1 Интеграция в существующий код

**НЕ НУЖНО:**
- ❌ Менять систему авторизации
- ❌ Создавать отдельные таймеры для отправки метрик
- ❌ Усложнять код retry механизмами
- ❌ Делать локальное кэширование в файлы

**НУЖНО:**
- ✅ Добавить счетчики в существующий код
- ✅ Использовать существующие заголовки авторизации
- ✅ Отправлять данные в рамках существующего поллинг цикла
- ✅ Держать данные в памяти (с ограничением размера)

### 4.2 Обработка ошибок

При ошибке отправки:
- Не падать, продолжать работу агента
- Вернуть данные в очередь для следующей попытки
- Логировать ошибку локально (console.error)
- Следующая попытка будет при следующем поллинге

### 4.3 Ограничения памяти

```go
// Константы лимитов
const (
	MaxClients     = 500 // Максимум клиентов в очереди
	MaxLogs        = 500 // Максимум логов в очереди
	LogsPerSend    = 100 // Логов за одну отправку
)

// При превышении - удалять самые старые
if len(pendingLogs) > MaxLogs {
	pendingLogs = pendingLogs[1:] // Удалить первый элемент
}
```

### 4.4 Производительность

- Отправка метрик не должна блокировать поллинг
- Если отправка затягивается - пропустить и отправить в следующий раз
- Статистика сбрасывается только после успешной отправки
- Jitter остается тем же (100-300мс)

---

## 5. Полный пример интеграции (Go)

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	"sync"
	"time"
)

// === СТРУКТУРЫ ДАННЫХ ===

type Config struct {
	AgentID string
	APIUrl  string
}

type ClientInfo struct {
	IP          string `json:"ip"`
	AgentID     string `json:"agentId"`
	UserAgent   string `json:"userAgent"`
	Country     string `json:"country,omitempty"`
	City        string `json:"city,omitempty"`
	CountryCode string `json:"countryCode,omitempty"`
}

type ResourceStats struct {
	InboundBytes      int64
	OutboundBytes     int64
	Requests          int64
	TotalResponseTime int64
	Errors            int64
}

type StatisticsPayload struct {
	AgentID        string `json:"agentId"`
	ResourceType   string `json:"resourceType"`
	ResourceID     string `json:"resourceId"`
	InboundBytes   int64  `json:"inboundBytes"`
	OutboundBytes  int64  `json:"outboundBytes"`
	Requests       int64  `json:"requests"`
	ResponseTimeMs int64  `json:"responseTimeMs"`
	Errors         int64  `json:"errors"`
}

type LogEntry struct {
	AgentID  string                 `json:"agentId"`
	Level    string                 `json:"level"`
	Message  string                 `json:"message"`
	Details  string                 `json:"details,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===

const (
	MaxClients  = 500
	MaxLogs     = 500
	LogsPerSend = 100
)

var (
	// Очереди с мьютексами для потокобезопасности
	pendingClients []ClientInfo
	clientsMutex   sync.Mutex
	
	pendingLogs []LogEntry
	logsMutex   sync.Mutex
	
	proxyStats  = make(map[string]*ResourceStats)
	domainStats = make(map[string]*ResourceStats)
	statsMutex  sync.RWMutex
)

// === СУЩЕСТВУЮЩИЙ ПОЛЛИНГ ЦИКЛ (МОДИФИЦИРОВАТЬ) ===

func pollingCycle(config *Config) {
	for {
		// 1. Существующий поллинг (БЕЗ ИЗМЕНЕНИЙ)
		pollReq := map[string]string{"agentId": config.AgentID}
		pollBody, _ := json.Marshal(pollReq)
		
		resp, err := http.Post(
			config.APIUrl+"/api/agent/poll",
			"application/json",
			bytes.NewBuffer(pollBody),
		)
		
		if err == nil && resp.StatusCode == 200 {
			// Обработка команд от сервера (СУЩЕСТВУЮЩАЯ ЛОГИКА)
			// var commands CommandResponse
			// json.NewDecoder(resp.Body).Decode(&commands)
			// processCommands(commands)
			
			// === ДОБАВИТЬ СЮДА: Отправка метрик ===
			
			// 2. Отправить клиентов
			sendPendingClients(config)
			
			// 3. Отправить статистику
			sendStatistics(config)
			
			// 4. Отправить логи
			sendLogs(config)
		} else if err != nil {
			addLog("error", "Polling failed", err.Error(), nil)
		}
		
		if resp != nil {
			resp.Body.Close()
		}
		
		// 5. Существующий jitter (БЕЗ ИЗМЕНЕНИЙ)
		jitter := time.Duration(100+rand.Intn(200)) * time.Millisecond
		time.Sleep(jitter)
	}
}

// === НОВЫЕ ФУНКЦИИ ===

func addLog(level, message, details string, metadata map[string]interface{}) {
	logsMutex.Lock()
	defer logsMutex.Unlock()
	
	pendingLogs = append(pendingLogs, LogEntry{
		Level:    level,
		Message:  message,
		Details:  details,
		Metadata: metadata,
	})
	
	if len(pendingLogs) > MaxLogs {
		pendingLogs = pendingLogs[1:]
	}
}

func sendPendingClients(config *Config) {
	clientsMutex.Lock()
	if len(pendingClients) == 0 {
		clientsMutex.Unlock()
		return
	}
	
	clients := make([]ClientInfo, len(pendingClients))
	copy(clients, pendingClients)
	pendingClients = nil
	clientsMutex.Unlock()
	
	for _, client := range clients {
		client.AgentID = config.AgentID
		data, _ := json.Marshal(client)
		
		resp, err := http.Post(
			config.APIUrl+"/api/clients",
			"application/json",
			bytes.NewBuffer(data),
		)
		
		if err != nil || resp.StatusCode != 200 {
			clientsMutex.Lock()
			pendingClients = append(pendingClients, client)
			clientsMutex.Unlock()
		}
		
		if resp != nil {
			resp.Body.Close()
		}
	}
}

func sendStatistics(config *Config) {
	statsMutex.Lock()
	
	// Копируем и сбрасываем прокси статистику
	proxyToSend := make(map[string]*ResourceStats)
	for k, v := range proxyStats {
		if v.Requests > 0 {
			proxyToSend[k] = v
			proxyStats[k] = &ResourceStats{}
		}
	}
	
	// Копируем и сбрасываем статистику доменов
	domainToSend := make(map[string]*ResourceStats)
	for k, v := range domainStats {
		if v.Requests > 0 {
			domainToSend[k] = v
			domainStats[k] = &ResourceStats{}
		}
	}
	
	statsMutex.Unlock()
	
	// Отправка прокси
	for proxyID, stats := range proxyToSend {
		payload := StatisticsPayload{
			AgentID:        config.AgentID,
			ResourceType:   "proxy",
			ResourceID:     proxyID,
			InboundBytes:   stats.InboundBytes,
			OutboundBytes:  stats.OutboundBytes,
			Requests:       stats.Requests,
			ResponseTimeMs: stats.TotalResponseTime / stats.Requests,
			Errors:         stats.Errors,
		}
		
		data, _ := json.Marshal(payload)
		http.Post(config.APIUrl+"/api/statistics", "application/json", bytes.NewBuffer(data))
	}
	
	// Отправка доменов
	for domainID, stats := range domainToSend {
		payload := StatisticsPayload{
			AgentID:        config.AgentID,
			ResourceType:   "domain",
			ResourceID:     domainID,
			InboundBytes:   stats.InboundBytes,
			OutboundBytes:  stats.OutboundBytes,
			Requests:       stats.Requests,
			ResponseTimeMs: stats.TotalResponseTime / stats.Requests,
			Errors:         stats.Errors,
		}
		
		data, _ := json.Marshal(payload)
		http.Post(config.APIUrl+"/api/statistics", "application/json", bytes.NewBuffer(data))
	}
}

func sendLogs(config *Config) {
	logsMutex.Lock()
	
	limit := LogsPerSend
	if len(pendingLogs) < limit {
		limit = len(pendingLogs)
	}
	
	if limit == 0 {
		logsMutex.Unlock()
		return
	}
	
	logsToSend := make([]LogEntry, limit)
	copy(logsToSend, pendingLogs[:limit])
	pendingLogs = pendingLogs[limit:]
	
	logsMutex.Unlock()
	
	for i, logEntry := range logsToSend {
		logEntry.AgentID = config.AgentID
		data, _ := json.Marshal(logEntry)
		
		resp, err := http.Post(
			config.APIUrl+"/api/logs",
			"application/json",
			bytes.NewBuffer(data),
		)
		
		if err != nil || resp.StatusCode != 200 {
			// Вернуть неотправленные логи
			logsMutex.Lock()
			pendingLogs = append(logsToSend[i:], pendingLogs...)
			logsMutex.Unlock()
			
			if resp != nil {
				resp.Body.Close()
			}
			break
		}
		
		if resp != nil {
			resp.Body.Close()
		}
	}
}

// === ИНТЕГРАЦИЯ В СУЩЕСТВУЮЩИЙ КОД ===

// При новом соединении
func handleConnection(conn net.Conn) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()
	
	remoteAddr := conn.RemoteAddr().String()
	geoData := lookupGeoIP(remoteAddr) // Ваша функция геолокации
	
	pendingClients = append(pendingClients, ClientInfo{
		IP:          remoteAddr,
		UserAgent:   "", // Получить из HTTP headers если есть
		Country:     geoData.Country,
		City:        geoData.City,
		CountryCode: geoData.CountryCode,
	})
	
	if len(pendingClients) > MaxClients {
		pendingClients = pendingClients[1:]
	}
	
	addLog("info", fmt.Sprintf("New connection from %s", remoteAddr), "", nil)
}

// Сбор статистики прокси
func trackProxyTraffic(proxyID string, inbound, outbound int64) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	
	proxyStats[proxyID].InboundBytes += inbound
	proxyStats[proxyID].OutboundBytes += outbound
}

func trackProxyRequest(proxyID string, responseTime time.Duration) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	
	proxyStats[proxyID].Requests++
	proxyStats[proxyID].TotalResponseTime += responseTime.Milliseconds()
}

func trackProxyError(proxyID string, err error) {
	statsMutex.Lock()
	if proxyStats[proxyID] == nil {
		proxyStats[proxyID] = &ResourceStats{}
	}
	proxyStats[proxyID].Errors++
	statsMutex.Unlock()
	
	addLog("error", fmt.Sprintf("Proxy error on %s", proxyID), err.Error(), nil)
}

// Аналогично для доменов
func trackDomainTraffic(domainID string, inbound, outbound int64) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	
	if domainStats[domainID] == nil {
		domainStats[domainID] = &ResourceStats{}
	}
	
	domainStats[domainID].InboundBytes += inbound
	domainStats[domainID].OutboundBytes += outbound
}

func main() {
	config := &Config{
		AgentID: "your-agent-id",
		APIUrl:  "https://your-server.com",
	}
	
	// Инициализация random
	rand.Seed(time.Now().UnixNano())
	
	// Запуск поллинг цикла
	go pollingCycle(config)
	
	// Ваша существующая логика агента
	// ...
	
	log.Println("Agent started")
	select {} // Блокировка main goroutine
}
```

---

## 9. Примеры событий для логирования

### Info уровень:
- Новое клиентское соединение
- Успешное подключение к upstream
- Обновление конфигурации
- Ротация логов
- Health check

### Warning уровень:
- Высокое использование памяти (>80%)
- Высокая CPU нагрузка (>80%)
- Медленный ответ от upstream (>5s)
- Приближение к лимиту соединений
- Отклоненные соединения (rate limiting)

### Error уровень:
- Сбой подключения к upstream
- Таймауты
- Неперехваченные исключения
- Ошибки SSL/TLS
- Ошибки парсинга данных
- Критические ошибки конфигурации

---

## 6. Checklist для разработчиков

- [ ] Добавлены глобальные очереди (pendingClients, pendingLogs)
- [ ] Добавлены счетчики статистики (proxyStats, domainStats)
- [ ] Функция addLog() добавлена во все места логирования
- [ ] Счетчики трафика добавлены в обработчики соединений
- [ ] В поллинг цикл добавлена отправка метрик (после poll, до jitter)
- [ ] Проверено что авторизация использует существующие заголовки
- [ ] Добавлены лимиты на размер очередей
- [ ] Протестировано локально с тестовым сервером
- [ ] Проверена работа при ошибках сети (агент продолжает работать)

---

## 7. Примечания

### Что НЕ нужно делать:
- ❌ Менять систему аутентификации
- ❌ Создавать отдельные таймеры/интервалы
- ❌ Делать сложный retry механизм
- ❌ Сохранять данные в файлы/базу

### Что НУЖНО сделать:
- ✅ Добавить счетчики в существующий код
- ✅ Отправлять данные в рамках существующего поллинга
- ✅ Использовать простые массивы/объекты для хранения
- ✅ При ошибке - пропустить и попробовать в следующий раз

### Частота отправки:
- Зависит от частоты поллинга агента
- Обычно каждые 100-300мс (с учетом jitter)
- Если данных нет - ничего не отправляется
- Статистика агрегируется между отправками
