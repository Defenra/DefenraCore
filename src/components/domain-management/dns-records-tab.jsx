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

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">DNS Записи</h3>
            <Button onClick={handleAddRecord}>
              <IconPlus className="h-4 w-4 mr-2" />
              Добавить запись
            </Button>
          </div>

          {domain.dnsRecords?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет DNS записей. Добавьте первую запись.
            </p>
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
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Collapsed View */}
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer bg-card hover:bg-accent/50"
                      onClick={() => onToggleExpand(index)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline">{record.type}</Badge>
                        <span className="font-mono text-sm font-medium">
                          {subdomain}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono text-sm">
                          {record.value}
                        </span>
                        {canProxy &&
                          (record.httpProxyEnabled ? (
                            <IconCloud className="h-4 w-4 text-orange-500" />
                          ) : (
                            <IconCloudOff className="h-4 w-4 text-muted-foreground" />
                          ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          TTL: {record.ttl}s
                        </span>
                        {isExpanded ? (
                          <IconChevronUp className="h-4 w-4" />
                        ) : (
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="p-4 border-t bg-muted/20 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Тип</label>
                            <Select
                              value={record.type}
                              onValueChange={(value) =>
                                handleUpdateRecord(index, "type", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="AAAA">AAAA</SelectItem>
                                <SelectItem value="CNAME">CNAME</SelectItem>
                                <SelectItem value="MX">MX</SelectItem>
                                <SelectItem value="TXT">TXT</SelectItem>
                                <SelectItem value="NS">NS</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Имя</label>
                            <Input
                              value={record.name}
                              onChange={(e) =>
                                handleUpdateRecord(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="@ или subdomain"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Значение (целевой IP)
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
                              placeholder="192.168.1.1"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              TTL (секунды)
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
                            />
                          </div>
                        </div>

                        {canProxy && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                            <div className="flex items-center gap-2">
                              {record.httpProxyEnabled ? (
                                <IconCloud className="h-5 w-5 text-orange-500" />
                              ) : (
                                <IconCloudOff className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  HTTP Проксирование
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Маршрутизация через агенты (GeoDNS)
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
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                            </label>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRecord(index)}
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Удалить
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
          <div className="mt-6 border rounded-lg p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  О HTTP проксировании
                </p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>
                    • Оранжевое облако{" "}
                    <IconCloud className="inline h-3 w-3 text-orange-500" /> -
                    трафик через агенты (GeoDNS)
                  </li>
                  <li>
                    • Серое облако <IconCloudOff className="inline h-3 w-3" /> -
                    прямое соединение
                  </li>
                  <li>• Доступно только для A, AAAA и CNAME записей</li>
                  <li>• Целевой IP указывается в поле "Значение"</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
