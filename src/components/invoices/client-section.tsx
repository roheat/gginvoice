"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Mail, MapPin, Plus } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
}

interface ClientSectionProps {
  clients: Client[];
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  showNewClientForm: boolean;
  newClientData: {
    name: string;
    email: string;
    address: string;
  };
  onNewClientChange: (field: string, value: string) => void;
  onNewClientSubmit: () => void;
  hasError?: boolean;
}

export function ClientSection({
  clients,
  selectedClientId,
  onClientSelect,
  showNewClientForm,
  newClientData,
  onNewClientChange,
  onNewClientSubmit,
  hasError = false,
}: ClientSectionProps) {
  const selectedClient = clients.find(
    (client) => client.id === selectedClientId
  );

  return (
    <Card className={hasError ? "border-red-300" : ""}>
      <CardHeader>
        <CardTitle>Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showNewClientForm ? (
          <>
            {/* Client Select */}
            <div className="space-y-2">
              <Label className={hasError ? "text-red-600" : ""}>Select Client *</Label>
              <Select value={selectedClientId} onValueChange={onClientSelect}>
                <SelectTrigger className={`w-full ${hasError ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                  <SelectValue placeholder="Choose a client or add new..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{client.name}</span>
                        {client.email && (
                          <span className="text-gray-500">
                            ({client.email})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add New Client</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {hasError && (
                <p className="text-xs text-red-600 mt-1">Please select or create a client</p>
              )}
            </div>

            {/* Selected Client Info */}
            {selectedClient && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">
                      {selectedClient.name}
                    </h3>
                    {selectedClient.email && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {selectedClient.email}
                        </span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-start space-x-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {selectedClient.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* New Client Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Add New Client</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClientSelect("")}
              >
                Cancel
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={newClientData.name}
                  onChange={(e) =>
                    onNewClientChange("clientName", e.target.value)
                  }
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="clientEmail">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) =>
                    onNewClientChange("clientEmail", e.target.value)
                  }
                  placeholder="Enter client email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="clientAddress">Client Address</Label>
                <Textarea
                  id="clientAddress"
                  value={newClientData.address}
                  onChange={(e) =>
                    onNewClientChange("clientAddress", e.target.value)
                  }
                  placeholder="Enter client address (optional)"
                  rows={3}
                />
              </div>

              <Button onClick={onNewClientSubmit} className="w-full">
                Create Client
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
