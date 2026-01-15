"use client";

import {
  IconChevronDown,
  IconChevronUp,
  IconCloud,
  IconCloudOff,
  IconInfoCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DnsRecordsTab({
  domain,
  onUpdate,
  expandedRecords,
  onToggleExpand,
}) {
  const handleAddRecord = () => {
    const newRecord = {
      type: "A",
      name: "@",
      value: "",
      ttl: 3600,
      priority: null,
      httpProxyEnabled: false,
    };
    onUpdate({ ...domain, dnsRecords: [...domain.dnsRecords, newRecord] });
  };

  const handleRemoveRecord = (index) => {
    const updated = domain.dnsRecords.filter((_, i) => i !== index);
    onUpdate({ ...domain, dnsRecords: updated });
  };

  const handleUpdateRecord = (index, field, value) => {
    const updated = [...domain.dnsRecords];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ ...domain, dnsRecords: updated });
  };

  const getRecordTypeColor = (type) => {
    const colors = {
      A: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      AAAA: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      CNAME: "bg-green-500/10 text-green-500 border-green-500/20",
      MX: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      TXT: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      NS: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold">DNS Записи</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Управление DNS записями для {domain.domain}
              </p>
            </div>
            <Button onClick={handleAddRecord} size="lg" className="h-11 px-6">
              <IconPlus className="h-5 w-5 mr-2" />
              Добавить запись
            </Button>
          </div>

          {domain.dnsRecords?.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/30">
              <IconInfoCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                Нет DNS записей
              </p>
              <p className="text-sm text-muted-foreground">
                Добавьте первую запись для начала работы
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domain.dnsRecords?.map((record, index) => {
                const canProxy = ["A", "AAAA", "CNAME"].includes(record.type);
                const subdomain =
                  record.name === "@"
                    ? domain.domain
                    : `${record.name}.${domain.domain}`;
                const isExpanded = expandedRecords.has(index);

                return (
                  <div
                    key={index}
                    className="border border-border rounded-xl overflow-hidden transition-all hover:border-primary/50 bg-card"
                  >
                    {/* Collapsed View */}
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onToggleExpand(index)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Badge
                          className={`${getRecordTypeColor(record.type)} font-mono text-xs px-3 py-1 border`}
                        >
                          {record.type}
                        </Badge>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-medium text-sm truncate">
                            {subdomain}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">
                            →
                          </span>
                          <span className="font-mono text-sm text-muted-foreground truncate">
                            {record.value || (
                              <span className="italic">не указано</span>
                            )}
                          </span>
                        </div>
                        {canProxy && (
                          <div className="flex-shrink-0">
                            {record.httpProxyEnabled ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <IconCloud className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-medium text-orange-500">
                                  Proxied
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                                <IconCloudOff className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  DNS Only
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <span className="text-sm text-muted-foreground font-mono">
                          {record.ttl}s
                        </span>
                        <div className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                          {isExpanded ? (
                            <IconChevronUp className="h-5 w-5" />
                          ) : (
                            <IconChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="p-6 border-t border-border bg-muted/20 space-y-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="space-y-2.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                              Тип записи
                            </label>
                            <Select
                              value={record.type}
                              onValueChange={(value) =>
                                handleUpdateRecord(index, "type", value)
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">
                                  A - IPv4 адрес
                                </SelectItem>
                                <SelectItem value="AAAA">
                                  AAAA - IPv6 адрес
                                </SelectItem>
                                <SelectItem value="CNAME">
                                  CNAME - Алиас
                                </SelectItem>
                                <SelectItem value="MX">
                                  MX - Почтовый сервер
                                </SelectItem>
                                <SelectItem value="TXT">
                                  TXT - Текстовая запись
                                </SelectItem>
                                <SelectItem value="NS">
                                  NS - Name Server
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                              Имя (поддомен)
                            </label>
                            <Input
                              value={record.name}
                              onChange={(e) =>
                                handleUpdateRecord(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="@ для корневого домена"
                              className="h-11"
                            />
                            <p className="text-xs text-muted-foreground">
                              Используйте @ для корневого домена или введите
                              поддомен
                            </p>
                          </div>

                          <div className="space-y-2.5 sm:col-span-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              Значение (целевой адрес)
                            </label>
                            <Input
                              value={record.value}
                              onChange={(e) =>
                                handleUpdateRecord(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              placeholder={
                                record.type === "A"
                                  ? "192.168.1.1"
                                  : record.type === "AAAA"
                                    ? "2001:0db8:85a3::8a2e:0370:7334"
                                    : record.type === "CNAME"
                                      ? "example.com"
                                      : "Введите значение"
                              }
                              className="h-11 font-mono"
                            />
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                              TTL (Time To Live)
                            </label>
                            <Input
                              type="number"
                              value={record.ttl}
                              onChange={(e) =>
                                handleUpdateRecord(
                                  index,
                                  "ttl",
                                  parseInt(e.target.value, 10),
                                )
                              }
                              className="h-11 font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                              Время кэширования в секундах
                            </p>
                          </div>
                        </div>

                        {canProxy && (
                          <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-gradient-to-r from-orange-500/5 to-orange-500/10 border-orange-500/20">
                            <div className="flex items-center gap-3">
                              {record.httpProxyEnabled ? (
                                <div className="p-2.5 rounded-lg bg-orange-500/20">
                                  <IconCloud className="h-6 w-6 text-orange-500" />
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-lg bg-muted">
                                  <IconCloudOff className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm">
                                  HTTP Проксирование
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Маршрутизация через агенты с GeoDNS и защитой
                                  от DDoS
                                </p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={record.httpProxyEnabled}
                                onChange={(e) =>
                                  handleUpdateRecord(
                                    index,
                                    "httpProxyEnabled",
                                    e.target.checked,
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
                            </label>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <Button
                            variant="destructive"
                            size="lg"
                            onClick={() => handleRemoveRecord(index)}
                            className="h-11"
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Удалить запись
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 border-2 rounded-xl p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10 flex-shrink-0">
                <IconInfoCircle className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-foreground">
                  О HTTP проксировании
                </p>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>
                      <strong className="text-orange-500">Proxied</strong> -
                      трафик проходит через агенты с GeoDNS маршрутизацией и
                      защитой от DDoS
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">DNS Only</strong> -
                      прямое соединение без проксирования
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Доступно только для A, AAAA и CNAME записей</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>
                      Целевой IP указывается в поле "Значение" и используется
                      агентами как backend
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
