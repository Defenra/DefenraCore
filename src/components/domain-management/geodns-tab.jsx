"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  X,
  Globe,
  Check,
  Info,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function ModernCard({ children, className }) {
  return (
    <div
      className={`border border-border/40 bg-card/60 backdrop-blur-sm rounded-lg overflow-hidden ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function GeoDnsTab({ domain, agents, onUpdate }) {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [newLocation, setNewLocation] = useState({
    code: "",
    name: "",
    type: "country",
    agentIds: [],
  });

  const handleAddLocation = () => {
    if (!newLocation.code || !newLocation.name) {
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

  const handleToggleAgent = (locationIndex, agentId) => {
    const updatedConfig = [...domain.geoDnsConfig];
    const location = updatedConfig[locationIndex];
    const currentIds = location.agentIds || [];

    if (currentIds.includes(agentId)) {
      location.agentIds = currentIds.filter((id) => id !== agentId);
    } else {
      location.agentIds = [...currentIds, agentId];
    }

    onUpdate({ ...domain, geoDnsConfig: updatedConfig });
  };

  const toggleLocationExpand = (index) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "continent":
        return <Globe className="h-3.5 w-3.5" />;
      case "country":
        return <MapPin className="h-3.5 w-3.5" />;
      default:
        return <MapPin className="h-3.5 w-3.5" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "continent":
        return "Continent";
      case "country":
        return "Country";
      default:
        return "Custom";
    }
  };

  return (
    <div className="space-y-6">
      <ModernCard>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  GeoDNS Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage geographic routing for DNS requests
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddLocation(true)}
              className="h-9"
              disabled={showAddLocation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Info Card */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  How GeoDNS works
                </span>
                <ChevronDown className="h-4 w-4 ml-auto text-blue-500" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm space-y-2">
                <p className="text-muted-foreground">
                  • Configure locations (continents, countries, custom regions)
                </p>
                <p className="text-muted-foreground">
                  • Agents receive configuration via API polling
                </p>
                <p className="text-muted-foreground">
                  • Assign agents to each location
                </p>
                <p className="text-muted-foreground">
                  • Clients from a location receive all assigned agent IPs
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Add Location Form */}
          {showAddLocation && (
            <div className="p-5 rounded-lg bg-muted/50 border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">New Location</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddLocation(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code</label>
                  <Input
                    value={newLocation.code}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, code: e.target.value })
                    }
                    placeholder="us, europe, asia"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newLocation.name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    placeholder="United States, Europe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newLocation.type}
                    onValueChange={(value) =>
                      setNewLocation({ ...newLocation, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="continent">Continent</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddLocation(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddLocation}>
                  Add Location
                </Button>
              </div>
            </div>
          )}

          {/* Locations Table */}
          {!domain.geoDnsConfig || domain.geoDnsConfig.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No locations configured
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first location to start geographic routing
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-24">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-28">Type</TableHead>
                    <TableHead className="w-32">Agents</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domain.geoDnsConfig.map((location, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm font-medium">
                          {location.code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1.5 w-fit"
                        >
                          {getTypeIcon(location.type)}
                          {getTypeLabel(location.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleLocationExpand(idx)}
                          className="text-sm text-primary hover:underline"
                        >
                          {location.agentIds?.length || 0} agents
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocation(idx)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Agent Assignment Panels */}
          {domain.geoDnsConfig?.map((location, idx) =>
            expandedLocations[idx] ? (
              <div
                key={`agents-${idx}`}
                className="p-5 rounded-lg border bg-muted/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{location.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {location.code}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLocationExpand(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => {
                    const isSelected = location.agentIds?.includes(agent.agentId);
                    return (
                      <label
                        key={agent.agentId}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleToggleAgent(idx, agent.agentId)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.ipAddress}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {agents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No agents available. Add agents first.
                  </p>
                )}
              </div>
            ) : null,
          )}
        </CardContent>
      </ModernCard>
    </div>
  );
}
