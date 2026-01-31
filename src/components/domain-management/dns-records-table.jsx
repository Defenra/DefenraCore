"use client";

import {
  IconCloud,
  IconCloudOff,
  IconCopy,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

const TYPE_COLORS = {
  A: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  AAAA: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  CNAME: "bg-green-500/10 text-green-600 border-green-500/20",
  MX: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  TXT: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  NS: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  SRV: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  CAA: "bg-red-500/10 text-red-600 border-red-500/20",
};

const PROXYABLE_TYPES = ["A", "AAAA", "CNAME"];

export function DnsRecordsTable({ domain, onUpdate }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: "A",
    name: "",
    value: "",
    ttl: 3600,
    priority: null,
    httpProxyEnabled: false,
  });

  const records = domain.dnsRecords || [];

  const handleSaveNew = () => {
    if (!newRecord.value) {
      toast.error("Value is required");
      return;
    }
    onUpdate({
      ...domain,
      dnsRecords: [...records, { ...newRecord, name: newRecord.name || "@" }],
    });
    setAddingNew(false);
    setNewRecord({
      type: "A",
      name: "",
      value: "",
      ttl: 3600,
      priority: null,
      httpProxyEnabled: false,
    });
    toast.success("Record added");
  };

  const handleSaveEdit = () => {
    if (!editingRecord.value) {
      toast.error("Value is required");
      return;
    }
    const updated = [...records];
    updated[editingIndex] = editingRecord;
    onUpdate({ ...domain, dnsRecords: updated });
    setEditingIndex(null);
    setEditingRecord(null);
    toast.success("Record updated");
  };

  const handleDelete = (index) => {
    if (!confirm("Delete this record?")) return;
    const updated = records.filter((_, i) => i !== index);
    onUpdate({ ...domain, dnsRecords: updated });
    toast.success("Record deleted");
  };

  const handleToggleProxy = (index) => {
    const updated = [...records];
    updated[index] = {
      ...updated[index],
      httpProxyEnabled: !updated[index].httpProxyEnabled,
    };
    onUpdate({ ...domain, dnsRecords: updated });
    toast.success(updated[index].httpProxyEnabled ? "Proxy enabled" : "Proxy disabled");
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditingRecord({ ...records[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingRecord(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getFullDomain = (name) => {
    if (!name || name === "@") return domain.domain;
    return `${name}.${domain.domain}`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {records.length} {records.length === 1 ? "record" : "records"}
        </div>
        <Button
          onClick={() => setAddingNew(true)}
          size="sm"
          className="h-8"
          disabled={addingNew}
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      {/* Records Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-16">Type</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Value</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-20">TTL</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-16">Proxy</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {/* New Record Row */}
            {addingNew && (
              <tr className="bg-primary/5">
                <td className="py-3 px-4">
                  <Select
                    value={newRecord.type}
                    onValueChange={(v) => setNewRecord({ ...newRecord, type: v })}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4">
                  <Input
                    value={newRecord.name}
                    onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                    placeholder="@ or subdomain"
                    className="h-8"
                  />
                </td>
                <td className="py-3 px-4">
                  <Input
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                    placeholder="IP or value"
                    className="h-8"
                  />
                </td>
                <td className="py-3 px-4">
                  <Input
                    type="number"
                    value={newRecord.ttl}
                    onChange={(e) => setNewRecord({ ...newRecord, ttl: parseInt(e.target.value) || 3600 })}
                    className="h-8 w-20"
                  />
                </td>
                <td className="py-3 px-4">
                  {PROXYABLE_TYPES.includes(newRecord.type) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNewRecord({ ...newRecord, httpProxyEnabled: !newRecord.httpProxyEnabled })}
                    >
                      {newRecord.httpProxyEnabled ? (
                        <IconCloud className="h-4 w-4 text-primary" />
                      ) : (
                        <IconCloudOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveNew}>
                      <IconCheck className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setAddingNew(false)}
                    >
                      <IconX className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {/* Existing Records */}
            {records.map((record, index) => {
              const isEditing = editingIndex === index;
              const canProxy = PROXYABLE_TYPES.includes(record.type);
              const subdomain = getFullDomain(record.name);

              return (
                <tr key={index} className={cn("hover:bg-muted/30", isEditing && "bg-muted/50")}>
                  {isEditing ? (
                    // Edit Mode
                    <>
                      <td className="py-3 px-4">
                        <Select
                          value={editingRecord.type}
                          onValueChange={(v) => setEditingRecord({ ...editingRecord, type: v })}
                        >
                          <SelectTrigger className="h-8 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECORD_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={editingRecord.name}
                          onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={editingRecord.value}
                          onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          value={editingRecord.ttl}
                          onChange={(e) => setEditingRecord({ ...editingRecord, ttl: parseInt(e.target.value) || 3600 })}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {canProxy && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingRecord({ ...editingRecord, httpProxyEnabled: !editingRecord.httpProxyEnabled })}
                          >
                            {editingRecord.httpProxyEnabled ? (
                              <IconCloud className="h-4 w-4 text-primary" />
                            ) : (
                              <IconCloudOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                            <IconCheck className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                            <IconX className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn("font-mono text-xs", TYPE_COLORS[record.type])}
                        >
                          {record.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <code className="text-sm font-mono">{record.name || "@"}</code>
                          <p className="text-xs text-muted-foreground">{subdomain}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono truncate max-w-[200px]">
                            {record.value}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <IconCopy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{record.ttl || 3600}s</span>
                      </td>
                      <td className="py-3 px-4">
                        {canProxy && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleProxy(index)}
                          >
                            {record.httpProxyEnabled ? (
                              <IconCloud className="h-4 w-4 text-primary" />
                            ) : (
                              <IconCloudOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(index)}>
                                <IconPencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(index)}
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {records.length === 0 && !addingNew && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  No DNS records. Click "Add Record" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <IconCloud className="h-3 w-3 text-primary" />
          <span>Proxy enabled</span>
        </div>
        <div className="flex items-center gap-1">
          <IconCloudOff className="h-3 w-3" />
          <span>Proxy disabled</span>
        </div>
      </div>
    </div>
  );
}
