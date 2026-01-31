"use client";

import { useState } from "react";
import {
  Code,
  Play,
  Trash2,
  Plus,
  Shield,
  AlertTriangle,
  Check,
  X,
  FileCode,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

function ModernCard({ children, className }) {
  return (
    <div
      className={`border border-border/40 bg-card/60 backdrop-blur-sm rounded-lg overflow-hidden ${className || ""}`}
    >
      {children}
    </div>
  );
}

const DEFAULT_RULES = [
  {
    id: "1",
    name: "Admin Protection",
    enabled: true,
    code: `-- Block /admin without authorization
if ngx.var.request_uri:match("/admin") and not ngx.var.http_authorization then
  return ngx.exit(403)
end`,
  },
  {
    id: "2",
    name: "Security Headers",
    enabled: true,
    code: `-- Add security headers
ngx.header["X-Frame-Options"] = "DENY"
ngx.header["X-Content-Type-Options"] = "nosniff"
ngx.header["X-XSS-Protection"] = "1; mode=block"`,
  },
  {
    id: "3",
    name: "Bot Blocker",
    enabled: false,
    code: `-- Block known bots
local user_agent = ngx.var.http_user_agent or ""
if user_agent:match("bot") or user_agent:match("crawler") then
  return ngx.exit(403)
end`,
  },
];

const LUA_EXAMPLES = `-- Example 1: Block /admin without authorization
if ngx.var.request_uri:match("/admin") and not ngx.var.http_authorization then
  return ngx.exit(403)
end

-- Example 2: Rate Limiting by IP
local ip = ngx.var.remote_addr
local limit_key = "rate_limit:" .. ip
local count = ngx.shared.cache:get(limit_key) or 0

if count > 100 then
  return ngx.exit(429)
end

ngx.shared.cache:incr(limit_key, 1, 0, 60)

-- Example 3: Block by User-Agent
local user_agent = ngx.var.http_user_agent or ""
if user_agent:match("bot") or user_agent:match("crawler") then
  return ngx.exit(403)
end

-- Example 4: Add Security Headers
ngx.header["X-Frame-Options"] = "DENY"
ngx.header["X-Content-Type-Options"] = "nosniff"

-- Example 5: Geoblocking
local country = ngx.var.geoip_country_code
if country == "CN" or country == "RU" then
  return ngx.exit(403)
end`;

export function LuaWafTab({ domain, onUpdate }) {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [selectedRule, setSelectedRule] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [editorContent, setEditorContent] = useState("");

  const handleEditorChange = (value) => {
    setEditorContent(value || "");
    onUpdate({
      ...domain,
      httpProxy: {
        ...domain.httpProxy,
        luaCode: value || "",
      },
    });
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setEditorContent("");
    setDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setEditorContent(rule.code);
    setDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!editorContent.trim()) return;

    if (editingRule) {
      setRules(
        rules.map((r) =>
          r.id === editingRule.id ? { ...r, code: editorContent } : r,
        ),
      );
    } else {
      const newRule = {
        id: Date.now().toString(),
        name: `Rule ${rules.length + 1}`,
        enabled: true,
        code: editorContent,
      };
      setRules([...rules, newRule]);
    }
    setDialogOpen(false);
    setEditorContent("");
  };

  const handleDeleteRule = (ruleId) => {
    setRules(rules.filter((r) => r.id !== ruleId));
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
    }
  };

  const handleToggleRule = (ruleId) => {
    setRules(
      rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    );
  };

  const handleTestRule = () => {
    // Simulated test
    setTestResult({
      status: Math.random() > 0.5 ? "allowed" : "blocked",
      reason: "Rule evaluation completed",
      executionTime: "0.3ms",
    });
  };

  const loadExamples = () => {
    setEditorContent(LUA_EXAMPLES);
  };

  return (
    <div className="space-y-6">
      <ModernCard>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Lua WAF Rules
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Write Lua scripts for request processing on edge agents
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestDialogOpen(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Rules
              </Button>
              <Button size="sm" onClick={handleAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info Card */}
          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Lua WAF Capabilities</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• Rate limiting by IP</div>
                  <div>• Bot blocking</div>
                  <div>• Security headers</div>
                  <div>• Custom rules</div>
                  <div>• Redirects</div>
                  <div>• Geoblocking</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Code className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No rules configured
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedRule(rule)}
                    >
                      <TableCell>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{rule.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.enabled ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRule(rule);
                            }}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRule(rule.id);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rule Preview */}
          {selectedRule && (
            <div className="p-5 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{selectedRule.name}</span>
                  <Badge
                    variant={selectedRule.enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {selectedRule.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRule(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <pre className="p-4 rounded-lg bg-muted text-xs font-mono overflow-x-auto">
                {selectedRule.code}
              </pre>
            </div>
          )}

          {/* Warning */}
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Warning</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Incorrect Lua code may cause service disruption. Test scripts
                  before applying in production.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </ModernCard>

      {/* Edit/Add Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Rule" : "Add New Rule"}
            </DialogTitle>
            <DialogDescription>
              Write Lua code for request processing
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadExamples}
                className="text-primary"
              >
                <Code className="h-4 w-4 mr-2" />
                Load Examples
              </Button>
            </div>

            <div
              className="border rounded-lg overflow-hidden"
              style={{ height: "300px" }}
            >
              <MonacoEditor
                height="100%"
                language="lua"
                theme="vs-dark"
                value={editorContent}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              <Save className="h-4 w-4 mr-2" />
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Rules</DialogTitle>
            <DialogDescription>
              Simulate a request to test your rules
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test URL</label>
              <Input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com/api/test"
              />
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-lg border ${
                  testResult.status === "allowed"
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.status === "allowed" ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`font-semibold ${
                      testResult.status === "allowed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {testResult.status === "allowed" ? "Allowed" : "Blocked"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {testResult.reason}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Execution time: {testResult.executionTime}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleTestRule}>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
