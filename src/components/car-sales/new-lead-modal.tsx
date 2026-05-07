"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewLeadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  sourceOfLead?: string;
}

export function NewLeadModal({ onClose, onSuccess }: NewLeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  
  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sourceOfLead, setSourceOfLead] = useState("");
  const [carType, setCarType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");

  const searchCustomers = async (term: string) => {
    if (!term) {
      setCustomers([]);
      return;
    }

    try {
      const response = await fetch(`/api/car-sales/customers?search=${term}`);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };

  const createCustomer = async () => {
    try {
      const response = await fetch("/api/car-sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          sourceOfLead,
        }),
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setSelectedCustomerId(newCustomer.id);
        setShowNewCustomerForm(false);
        setCustomers([newCustomer]);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const createLead = async () => {
    if (!selectedCustomerId || !carType || !registrationNumber) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/car-sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          carType,
          registrationNumber,
          commissionAmount: commissionAmount ? parseFloat(commissionAmount) : null,
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating lead:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <Label>Customer</Label>
            
            {!showNewCustomerForm ? (
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Search existing customers..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSearchTerm(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomers([]);
                            setSearchTerm(customer.name);
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full"
                >
                  + Create New Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerEmail(e.target.value)}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sourceOfLead">Source of Lead</Label>
                    <Input
                      id="sourceOfLead"
                      value={sourceOfLead}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSourceOfLead(e.target.value)}
                      placeholder="e.g., Website, Referral"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={createCustomer}
                    disabled={!customerName || !customerPhone}
                  >
                    Create Customer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setCustomerName("");
                      setCustomerPhone("");
                      setCustomerEmail("");
                      setSourceOfLead("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-4">
            <Label>Car Details</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="carType">Car Type *</Label>
                <Input
                  id="carType"
                  value={carType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCarType(e.target.value)}
                  placeholder="e.g., Toyota Prado, Subaru XV"
                />
              </div>
              <div>
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., KDG 234X"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="commissionAmount">Commission Amount</Label>
              <Input
                id="commissionAmount"
                type="number"
                value={commissionAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommissionAmount(e.target.value)}
                placeholder="Commission amount (KES)"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={createLead}
            disabled={!selectedCustomerId || !carType || !registrationNumber || loading}
          >
            {loading ? "Creating..." : "Create Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
