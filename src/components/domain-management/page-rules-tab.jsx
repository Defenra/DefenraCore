"use client";

import {
  IconPlus,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PageRulesTab({ domain, onUpdate }) {
  const [rules, setRules] = useState(domain.pageRules || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    enabled: true,
    priority: 1,
    urlPattern: "",
    actions: {
      securityLevel: "",
      cacheLevel: "",
      browserCacheTtl: "",
      alwaysUseHttps: false,
      forwardingUrl: { statusCode: 301, url: "" },
      disableSecurity: false,
      disableRateLimiting: false,
      resolveOverride: "",
    },
  });

  const handleAddRule = () => {
    setEditingRule(null);
    setFormData({
      enabled: true,
      priority: rules.length + 1,
      urlPattern: "",
      actions: {
        securityLevel: "",
        cacheLevel: "",
        browserCacheTtl: "",
        alwaysUseHttps: false,
        forwardingUrl: { statusCode: 301, url: "" },
        disableSecurity: false,
        disableRateLimiting: false,
        resolveOverride: "",
      },
    });
    setDialogOpen(true);
  };

  const handleEditRule = (index) => {
    setEditingRule(index);
    setFormData(rules[index]);
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formData.urlPattern) {
      toast.error("URL Pattern обязателен");
      return;
    }

    const newRules = [...rules];
    if (editingRule !== null) {
      newRules[editingRule] = formData;
    } else {
      newRules.push(formData);
    }

    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      setDialogOpen(false);
      toast.success("Page Rule сохранён");
    } catch (error) {
      toast.error("Ошибка сохранения");
    }
  };

  const handleDeleteRule = async (index) => {
    if (!confirm("Удалить это правило?")) return;

    const newRules = rules.filter((_, i) => i !== index);
    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      toast.success("Page Rule удалён");
    } catch (error) {
      toast.error("Ошибка удаления");
    }
  };

  const handleToggleRule = async (index) => {
    const newRules = [...rules];
    newRules[index].enabled = !newRules[index].enabled;

    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      toast.success("Статус изменён");
    } catch (error) {
      toast.error("Ошибка изменения статуса");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Rules</CardTitle>
              <CardDescription>
                Настройте правила для конкретных URL паттернов (аналог
                CloudFlare Page Rules)
              </CardDescription>
            </div>
            <Button onClick={handleAddRule}>
              <IconPlus className="mr-2 h-4 w-4" />
              Добавить правило
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет настроенных правил
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm bg-accent px-2 py-1 rounded">
                          Priority: {rule.priority}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            rule.enabled
                              ? "bg-green-500/20 text-green-600"
                              : "bg-zinc-500/20 text-zinc-600"
                          }`}
                        >
                          {rule.enabled ? "Активно" : "Отключено"}
                        </span>
                      </div>
                      <div className="font-mono text-sm mb-2">
                        {rule.urlPattern}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {rule.actions.securityLevel && (
                          <div>
                            Security Level: {rule.actions.securityLevel}
                          </div>
                        )}
                        {rule.actions.cacheLevel && (
                          <div>Cache Level: {rule.actions.cacheLevel}</div>
                        )}
                        {rule.actions.alwaysUseHttps && (
                          <div>Always Use HTTPS: Enabled</div>
                        )}
                        {rule.actions.forwardingUrl?.url && (
                          <div>
                            Redirect: {rule.actions.forwardingUrl.statusCode} →{" "}
                            {rule.actions.forwardingUrl.url}
                          </div>
                        )}
                        {rule.actions.disableSecurity && (
                          <div>Security: Disabled</div>
                        )}
                        {rule.actions.disableRateLimiting && (
                          <div>Rate Limiting: Disabled</div>
                        )}
                        {rule.actions.resolveOverride && (
                          <div>
                            Backend Override: {rule.actions.resolveOverride}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRule(index)}
                      >
                        <IconPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleRule(index)}
                      >
                        {rule.enabled ? (
                          <IconToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <IconToggleLeft className="h-5 w-5 text-zinc-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule !== null ? "Редактировать" : "Добавить"} Page Rule
            </DialogTitle>
            <DialogDescription>
              Настройте правило для конкретного URL паттерна
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL Pattern *</Label>
                <Input
                  placeholder="example.com/api/*"
                  value={formData.urlPattern}
                  onChange={(e) =>
                    setFormData({ ...formData, urlPattern: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Используйте * для любых символов, ? для одного символа
                </p>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Security Level</Label>
              <Select
                value={formData.actions.securityLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    actions: { ...formData.actions, securityLevel: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не изменять" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не изменять</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="essentially_off">
                    Essentially Off
                  </SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="under_attack">Under Attack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cache Level</Label>
              <Select
                value={formData.actions.cacheLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    actions: { ...formData.actions, cacheLevel: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не изменять" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не изменять</SelectItem>
                  <SelectItem value="bypass">Bypass</SelectItem>
                  <SelectItem value="no_query_string">
                    No Query String
                  </SelectItem>
                  <SelectItem value="ignore_query_string">
                    Ignore Query String
                  </SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="cache_everything">
                    Cache Everything
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Browser Cache TTL (seconds)</Label>
              <Input
                type="number"
                placeholder="3600"
                value={formData.actions.browserCacheTtl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      browserCacheTtl: e.target.value
                        ? parseInt(e.target.value, 10)
                        : "",
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Forwarding URL (Redirect)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={String(
                    formData.actions.forwardingUrl?.statusCode || 301,
                  )}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        forwardingUrl: {
                          ...formData.actions.forwardingUrl,
                          statusCode: parseInt(value, 10),
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301</SelectItem>
                    <SelectItem value="302">302</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-2"
                  placeholder="https://example.com/new-url"
                  value={formData.actions.forwardingUrl?.url || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        forwardingUrl: {
                          ...formData.actions.forwardingUrl,
                          url: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Backend Override</Label>
              <Input
                placeholder="192.168.1.100:8080"
                value={formData.actions.resolveOverride}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      resolveOverride: e.target.value,
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Переопределить backend для этого URL
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="alwaysHttps"
                  checked={formData.actions.alwaysUseHttps}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        alwaysUseHttps: e.target.checked,
                      },
                    })
                  }
                />
                <Label htmlFor="alwaysHttps">Always Use HTTPS</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disableSecurity"
                  checked={formData.actions.disableSecurity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        disableSecurity: e.target.checked,
                      },
                    })
                  }
                />
                <Label htmlFor="disableSecurity">Disable Security (WAF)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disableRateLimit"
                  checked={formData.actions.disableRateLimiting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actions: {
                        ...formData.actions,
                        disableRateLimiting: e.target.checked,
                      },
                    })
                  }
                />
                <Label htmlFor="disableRateLimit">Disable Rate Limiting</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveRule}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
