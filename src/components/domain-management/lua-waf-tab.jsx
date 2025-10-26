"use client";

import { IconCode, IconInfoCircle } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const LUA_EXAMPLES = `-- Пример 1: Блокировка /admin без авторизации
if ngx.var.request_uri:match("/admin") and not ngx.var.http_authorization then
  return ngx.exit(403)
end

-- Пример 2: Rate Limiting по IP
local ip = ngx.var.remote_addr
local limit_key = "rate_limit:" .. ip
local count = ngx.shared.cache:get(limit_key) or 0

if count > 100 then
  return ngx.exit(429) -- Too Many Requests
end

ngx.shared.cache:incr(limit_key, 1, 0, 60) -- 100 requests per minute

-- Пример 3: Блокировка по User-Agent
local user_agent = ngx.var.http_user_agent or ""
if user_agent:match("bot") or user_agent:match("crawler") then
  return ngx.exit(403)
end

-- Пример 4: Добавление security headers
ngx.header["X-Frame-Options"] = "DENY"
ngx.header["X-Content-Type-Options"] = "nosniff"
ngx.header["X-XSS-Protection"] = "1; mode=block"

-- Пример 5: Геоблокировка
local country = ngx.var.geoip_country_code
if country == "CN" or country == "RU" then
  return ngx.exit(403)
end

-- Пример 6: Custom redirect
if ngx.var.request_uri == "/old-page" then
  return ngx.redirect("/new-page", 301)
end`;

export function LuaWafTab({ domain, onUpdate }) {
  const handleEditorChange = (value) => {
    onUpdate({
      ...domain,
      httpProxy: {
        ...domain.httpProxy,
        luaCode: value || "",
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardTitle className="text-xl flex items-center gap-2">
            <IconCode className="h-5 w-5 text-purple-500" />
            Lua WAF / Middleware
          </CardTitle>
          <CardDescription className="mt-1.5">
            Напишите Lua скрипт для обработки запросов на edge агентах
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info */}
          <div className="border rounded-lg p-4 bg-purple-500/5 border-purple-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Возможности Lua WAF
                </p>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>
                    • <strong>Rate Limiting</strong> - ограничение запросов по
                    IP
                  </li>
                  <li>
                    • <strong>Блокировка</strong> - ботов, стран, User-Agent
                  </li>
                  <li>
                    • <strong>Security Headers</strong> - добавление заголовков
                    безопасности
                  </li>
                  <li>
                    • <strong>Custom Rules</strong> - любая логика обработки
                    запросов
                  </li>
                  <li>
                    • <strong>Redirects</strong> - перенаправления и редиректы
                  </li>
                  <li>
                    • <strong>Access Control</strong> - управление доступом по
                    условиям
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-muted/50 rounded">
                  <p className="font-medium text-xs mb-2">
                    Доступные переменные:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">
                        ngx.var.remote_addr
                      </span>{" "}
                      - IP клиента
                    </div>
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">
                        ngx.var.request_uri
                      </span>{" "}
                      - URI запроса
                    </div>
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">
                        ngx.var.http_*
                      </span>{" "}
                      - HTTP заголовки
                    </div>
                    <div>
                      <span className="text-purple-600 dark:text-purple-400">
                        ngx.var.geoip_*
                      </span>{" "}
                      - Геоданные
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lua Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Lua Code</label>
              <button
                type="button"
                onClick={() => handleEditorChange(LUA_EXAMPLES)}
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Загрузить примеры
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <MonacoEditor
                height="400px"
                language="lua"
                theme="vs-dark"
                value={domain.httpProxy?.luaCode || ""}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Скрипт выполняется на всех агентах перед проксированием запроса
              на целевой сервер
            </p>
          </div>

          {/* Warning */}
          <div className="border rounded-lg p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">⚠️ Важно</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Некорректный Lua код может привести к отказу в обслуживании.
                  Тестируйте скрипты перед применением в production.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
