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
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sourceOfLead, setSourceOfLead] = useState("");
  const [carType, setCarType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");

  const validatePhoneFormat = (phone: string): boolean => {
    return /^[\d\s\+\-\(\)]{10,}$/.test(phone.replace(/\s/g, ""));
  };

  const validateEmailFormat = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateRegistrationFormat = (regNo: string): boolean => {
    return /^[A-Z]{3}\s?\d{3}[A-Z]{1}$/.test(regNo.trim());
  };

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
    const newErrors: Record<string, string> = {};
    
    if (!customerName?.trim()) {
      newErrors.customerName = "⚠️ Customer name is required to create a new customer";
    }
    
    if (!customerPhone?.trim()) {
      newErrors.customerPhone = "⚠️ Phone number is required";
    } else if (!validatePhoneFormat(customerPhone)) {
      newErrors.customerPhone = "⚠️ Enter a valid phone number (e.g., 0712 345 678 or +254 712 345 678)";
    }
    
    if (customerEmail && !validateEmailFormat(customerEmail)) {
      newErrors.customerEmail = "⚠️ Enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("❌ Please fix the errors below before creating the customer.");
      return;
    }

    setError("");
    setErrors({});

    try {
      const response = await fetch("/api/car-sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          sourceOfLead: sourceOfLead || null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`❌ ${data.error || "Failed to create customer. Please try again."}`);
        return;
      }

      setSelectedCustomerId(data.id);
      setShowNewCustomerForm(false);
      setCustomers([data]);
    } catch (err) {
      setError("❌ An error occurred while creating the customer.");
      console.error("Error creating customer:", err);
    }
  };

  const createLead = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedCustomerId) {
      newErrors.customer = "⚠️ Please select or create a customer to proceed";
    }
    
    if (!carType?.trim()) {
      newErrors.carType = "⚠️ Car type is required (e.g., Toyota Prado, Subaru XV)";
    }
    
    if (!registrationNumber?.trim()) {
      newErrors.registrationNumber = "⚠️ Registration number is required (e.g., KDG 234X)";
    } else if (!validateRegistrationFormat(registrationNumber)) {
      newErrors.registrationNumber = "⚠️ Invalid registration format. Use format like KDG 234X";
    }
    
    if (commissionAmount && isNaN(parseFloat(commissionAmount))) {
      newErrors.commissionAmount = "⚠️ Commission amount must be a valid number";
    } else if (commissionAmount && parseFloat(commissionAmount) < 0) {
      newErrors.commissionAmount = "⚠️ Commission amount cannot be negative";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("❌ Please fix all errors before creating the lead.");
      return;
    }

    setError("");
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("/api/car-sales/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          carType,
          registrationNumber: registrationNumber.toUpperCase(),
          commissionAmount: commissionAmount ? parseFloat(commissionAmount) : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`❌ ${data.error || "Failed to create lead. Please try again."}`);
        return;
      }
      
      onSuccess();
    } catch (err) {
      setError("❌ An error occurred while creating the lead.");
      console.error("Error creating lead:", err);
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

        {error && (
          <div style={{ padding: "12px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <div>
              <Label>Customer *</Label>
              {errors.customer && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customer}</div>}
            </div>
            
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
                            setErrors(prev => ({ ...prev, customer: "" }));
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors(prev => ({ ...prev, customerName: "" }));
                      }}
                      placeholder="Customer name"
                      style={{ borderColor: errors.customerName ? "#f87171" : undefined }}
                    />
                    {errors.customerName && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customerName}</div>}
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone) setErrors(prev => ({ ...prev, customerPhone: "" }));
                      }}
                      placeholder="0712 345 678"
                      style={{ borderColor: errors.customerPhone ? "#f87171" : undefined }}
                    />
                    {errors.customerPhone && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customerPhone}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setCustomerEmail(e.target.value);
                        if (errors.customerEmail) setErrors(prev => ({ ...prev, customerEmail: "" }));
                      }}
                      placeholder="john@example.com"
                      style={{ borderColor: errors.customerEmail ? "#f87171" : undefined }}
                    />
                    {errors.customerEmail && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.customerEmail}</div>}
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
                      setErrors(prev => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "" }));
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCarType(e.target.value);
                    if (errors.carType) setErrors(prev => ({ ...prev, carType: "" }));
                  }}
                  placeholder="e.g., Toyota Prado"
                  style={{ borderColor: errors.carType ? "#f87171" : undefined }}
                />
                {errors.carType && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.carType}</div>}
              </div>
              <div>
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRegistrationNumber(e.target.value.toUpperCase());
                    if (errors.registrationNumber) setErrors(prev => ({ ...prev, registrationNumber: "" }));
                  }}
                  placeholder="KDG 234X"
                  style={{ borderColor: errors.registrationNumber ? "#f87171" : undefined }}
                />
                {errors.registrationNumber && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.registrationNumber}</div>}
              </div>
            </div>

            <div>
              <Label htmlFor="commissionAmount">Commission Amount</Label>
              <Input
                id="commissionAmount"
                type="number"
                value={commissionAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCommissionAmount(e.target.value);
                  if (errors.commissionAmount) setErrors(prev => ({ ...prev, commissionAmount: "" }));
                }}
                placeholder="Commission amount (KES)"
                style={{ borderColor: errors.commissionAmount ? "#f87171" : undefined }}
              />
              {errors.commissionAmount && <div style={{ color: "#f87171", fontSize: "12px", marginTop: "4px" }}>{errors.commissionAmount}</div>}
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
