"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Globe,
  Shield,
  Lock,
  Clock,
  ExternalLink,
  AlertCircle,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

function ModernCard({ children, className }) {
  return (
    <div
      className={`border border-border/40 bg-card/60 backdrop-blur-sm rounded-lg overflow-hidden ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function PageRulesTab({ domain, onUpdate }) {
  const [rules, setRules] = useState(domain.pageRules || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    enabled: true,
    priority: 1,
    urlPattern: "",
    actions: {
      securityLevel: "none",
      cacheLevel: "none",
      browserCacheTtl: "",
      alwaysUseHttps: false,
      forwardingUrl: { statusCode: 301, url: "" },
      disableSecurity: false,
      disableRateLimiting: false,
      resolveOverride: "",
    },
  });

  const handleAddRule = () => {
    setEditingIndex(null);
    setFormData({
      enabled: true,
      priority: rules.length + 1,
      urlPattern: "",
      actions: {
        securityLevel: "none",
        cacheLevel: "none",
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
    setEditingIndex(index);
    const rule = rules[index];
    setFormData({
      ...rule,
      actions: {
        securityLevel: rule.actions?.securityLevel || "none",
        cacheLevel: rule.actions?.cacheLevel || "none",
        browserCacheTtl: rule.actions?.browserCacheTtl || "",
        alwaysUseHttps: rule.actions?.alwaysUseHttps || false,
        forwardingUrl: rule.actions?.forwardingUrl || {
          statusCode: 301,
          url: "",
        },
        disableSecurity: rule.actions?.disableSecurity || false,
        disableRateLimiting: rule.actions?.disableRateLimiting || false,
        resolveOverride: rule.actions?.resolveOverride || "",
      },
    });
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formData.urlPattern) {
      toast.error("URL Pattern is required");
      return;
    }

    // Convert "none" back to empty string for saving
    const sanitizedFormData = {
      ...formData,
      actions: {
        ...formData.actions,
        securityLevel:
          formData.actions.securityLevel === "none"
            ? ""
            : formData.actions.securityLevel,
        cacheLevel:
          formData.actions.cacheLevel === "none"
            ? ""
            : formData.actions.cacheLevel,
      },
    };

    const newRules = [...rules];
    if (editingIndex !== null) {
      newRules[editingIndex] = sanitizedFormData;
    } else {
      newRules.push(sanitizedFormData);
    }

    // Sort by priority
    newRules.sort((a, b) => (a.priority || 1) - (b.priority || 1));

    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      setDialogOpen(false);
      toast.success("Page rule saved");
    } catch (_error) {
      toast.error("Error saving rule");
    }
  };

  const handleDeleteRule = async (index) => {
    if (!confirm("Delete this rule?")) return;

    const newRules = rules.filter((_, i) => i !== index);
    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      toast.success("Page rule deleted");
    } catch (_error) {
      toast.error("Error deleting rule");
    }
  };

  const handleToggleRule = async (index) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], enabled: !newRules[index].enabled };

    try {
      await onUpdate({ pageRules: newRules });
      setRules(newRules);
      toast.success("Status updated");
    } catch (_error) {
      toast.error("Error updating status");
    }
  };

  const handleMoveRule = (index, direction) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rules.length - 1) return;

    const newRules = [...rules];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newRules[index], newRules[newIndex]] = [
      newRules[newIndex],
      newRules[index],
    ];

    // Update priorities
    newRules.forEach((rule, i) => {
      rule.priority = i + 1;
    });

    setRules(newRules);
    onUpdate({ pageRules: newRules });
  };

  const getActionSummary = (actions) => {
    const summary = [];
    if (actions.securityLevel && actions.securityLevel !== "none")
      summary.push(`Security: ${actions.securityLevel}`);
    if (actions.cacheLevel && actions.cacheLevel !== "none")
      summary.push(`Cache: ${actions.cacheLevel}`);
    if (actions.alwaysUseHttps) summary.push("HTTPS");
    if (actions.forwardingUrl?.url) summary.push("Redirect");
    if (actions.disableSecurity) summary.push("Security Off");
    if (actions.disableRateLimiting) summary.push("Rate Limit Off");
    if (actions.resolveOverride) summary.push("Backend Override");
    return summary.length > 0 ? summary.join(", ") : "No actions";
  };

  const getSecurityIcon = (level) => {
    switch (level) {
      case "off":
      case "essentially_off":
        return <Shield className="h-3.5 w-3.5 text-gray-500" />;
      case "low":
        return <Shield className="h-3.5 w-3.5 text-blue-500" />;
      case "medium":
        return <Shield className="h-3.5 w-3.5 text-yellow-500" />;
      case "high":
      case "under_attack":
        return <Shield className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ModernCard>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Page Rules
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure rules for specific URL patterns
                </p>
              </div>
            </div>
            <Button onClick={handleAddRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {rules.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No page rules configured
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add rules to customize behavior for specific URLs
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>URL Pattern</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {rule.priority || index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-medium">
                          {rule.urlPattern}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rule.actions?.securityLevel &&
                            rule.actions.securityLevel !== "none" && (
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                              >
                                {getSecurityIcon(rule.actions.securityLevel)}
                                {rule.actions.securityLevel}
                              </Badge>
                            )}
                          {rule.actions?.cacheLevel &&
                            rule.actions.cacheLevel !== "none" && (
                              <Badge
                                variant="outline"
                                className="text-xs flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {rule.actions.cacheLevel}
                              </Badge>
                            )}
                          {rule.actions?.alwaysUseHttps && (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20"
                            >
                              <Lock className="h-3 w-3" />
                              HTTPS
                            </Badge>
                          )}
                          {rule.actions?.forwardingUrl?.url && (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Redirect
                            </Badge>
                          )}
                          {rule.actions?.disableSecurity && (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1 bg-red-500/10 text-red-600 border-red-500/20"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Security Off
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(index)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveRule(index, "up")}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveRule(index, "down")}
                            disabled={index === rules.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </ModernCard>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Page Rule" : "Add Page Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure a rule for a specific URL pattern
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* URL Pattern & Priority */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  URL Pattern <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="example.com/api/*"
                  value={formData.urlPattern}
                  onChange={(e) =>
                    setFormData({ ...formData, urlPattern: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Use * for wildcards, ? for single characters
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Priority</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers execute first
                </p>
              </div>
            </div>

            {/* Security Level */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">Security Level</label>
              </div>
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
                  <SelectValue placeholder="Don't change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't change</SelectItem>
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

            {/* Cache Level */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">Cache Level</label>
              </div>
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
                  <SelectValue placeholder="Don't change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Don't change</SelectItem>
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

            {/* Browser Cache TTL */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">
                  Browser Cache TTL (seconds)
                </label>
              </div>
              <Input
                type="number"
                placeholder="3600"
                value={formData.actions.browserCacheTtl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actions: {
                      ...formData.actions,
                      browserCacheTtl: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* Forwarding URL */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">Forwarding URL</label>
              </div>
              <div className="grid grid-cols-4 gap-2">
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
                    <SelectItem value="301">301 (Permanent)</SelectItem>
                    <SelectItem value="302">302 (Temporary)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="col-span-3"
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

            {/* Backend Override */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <label className="text-sm font-semibold">
                  Backend Override
                </label>
              </div>
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
                Override the backend for this URL pattern
              </p>
            </div>

            {/* Toggles */}
            <div className="p-4 rounded-lg border space-y-3">
              <label className="text-sm font-semibold">Options</label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Always Use HTTPS</span>
                  </div>
                  <Switch
                    checked={formData.actions.alwaysUseHttps}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        actions: {
                          ...formData.actions,
                          alwaysUseHttps: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Disable Security (WAF)</span>
                  </div>
                  <Switch
                    checked={formData.actions.disableSecurity}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        actions: {
                          ...formData.actions,
                          disableSecurity: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Disable Rate Limiting</span>
                  </div>
                  <Switch
                    checked={formData.actions.disableRateLimiting}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        actions: {
                          ...formData.actions,
                          disableRateLimiting: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              <Check className="h-4 w-4 mr-2" />
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
