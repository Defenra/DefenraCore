"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconPlus,
  IconTrash,
  IconMapPin,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";

export function GeoDnsTab({ domain, agents, onUpdate }) {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    code: "",
    name: "",
    type: "country",
    agentIds: [],
  });

  const handleAddLocation = () => {
    if (!newLocation.code || !newLocation.name) {
      alert("Заполните код и название локации");
      return;
    }
    const updatedConfig = [...(domain.geoDnsConfig || []), { ...newLocation }];
    onUpdate({ ...domain, geoDnsConfig: updatedConfig });
    setNewLocation({ code: "", name: "", type: "country", agentIds: [] });
    setShowAddLocation(false);
  };

  const handleRemoveLocation = (index) => {
    const updatedConfig = domain.geoDnsConfig.filter((_, i) => i !== index);
    onUpdate({ ...domain, geoDnsConfig: updatedConfig });
  };

  const handleUpdateLocationAgents = (index, agentIds) => {
    const updatedConfig = [...domain.geoDnsConfig];
    updatedConfig[index].agentIds = agentIds;
    onUpdate({ ...domain, geoDnsConfig: updatedConfig });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <IconMapPin className="h-5 w-5 text-emerald-500" />
                GeoDNS Конфигурация
              </CardTitle>
              <CardDescription className="mt-1.5">
                Управление геолокационной маршрутизацией DNS запросов
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddLocation(true)}>
              <IconPlus className="h-4 w-4 mr-2" />
              Добавить локацию
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info */}
          <div className="border rounded-lg p-4 bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  Как работает GeoDNS
                </p>
                <ul className="text-muted-foreground space-y-1.5 text-xs">
                  <li>
                    • Панель управляет конфигурацией локаций (континенты,
                    страны, custom)
                  </li>
                  <li>• Агенты получают конфигурацию через API поллинг</li>
                  <li>• Для каждой локации вы назначаете список агентов</li>
                  <li>
                    • Клиент из локации получит IP всех назначенных агентов
                    (множественные A записи)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Add Location Form */}
          {showAddLocation && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Новая локация</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddLocation(false)}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Код</label>
                  <input
                    type="text"
                    value={newLocation.code}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, code: e.target.value })
                    }
                    placeholder="us, europe, custom-region"
                    className="w-full px-3 py-2 rounded border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Название</label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    placeholder="США, Европа, Кастомный регион"
                    className="w-full px-3 py-2 rounded border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Тип</label>
                  <select
                    value={newLocation.type}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded border bg-background"
                  >
                    <option value="continent">Континент</option>
                    <option value="country">Страна</option>
                    <option value="custom">Кастомная</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddLocation(false)}
                >
                  Отмена
                </Button>
                <Button onClick={handleAddLocation}>Добавить</Button>
              </div>
            </div>
          )}

          {/* Locations Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Код</th>
                  <th className="text-left p-3 text-sm font-medium">
                    Название
                  </th>
                  <th className="text-left p-3 text-sm font-medium">Тип</th>
                  <th className="text-left p-3 text-sm font-medium">Агенты</th>
                  <th className="text-right p-3 text-sm font-medium w-24">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!domain.geoDnsConfig || domain.geoDnsConfig.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Локаций пока нет. Нажмите "Добавить локацию" чтобы создать
                      первую.
                    </td>
                  </tr>
                ) : (
                  domain.geoDnsConfig.map((location, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3">
                        <span className="font-mono text-sm font-medium">
                          {location.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{location.name}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {location.type === "continent"
                            ? "Континент"
                            : location.type === "country"
                              ? "Страна"
                              : "Кастомная"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {agents
                            .filter((a) =>
                              location.agentIds?.includes(a.agentId),
                            )
                            .map((agent, aidx) => (
                              <Badge
                                key={aidx}
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                {agent.name}
                                <button
                                  onClick={() => {
                                    const updatedIds = location.agentIds.filter(
                                      (id) => id !== agent.agentId,
                                    );
                                    handleUpdateLocationAgents(idx, updatedIds);
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <IconX className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                const updatedIds = [
                                  ...(location.agentIds || []),
                                  e.target.value,
                                ];
                                handleUpdateLocationAgents(idx, updatedIds);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded border bg-background"
                          >
                            <option value="">+ Добавить</option>
                            {agents
                              .filter(
                                (a) => !location.agentIds?.includes(a.agentId),
                              )
                              .map((agent) => (
                                <option
                                  key={agent.agentId}
                                  value={agent.agentId}
                                >
                                  {agent.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocation(idx)}
                          className="h-8 w-8 p-0"
                        >
                          <IconTrash className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
