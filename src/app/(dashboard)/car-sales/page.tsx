"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Car, Calendar, DollarSign } from "lucide-react";
import { LeadCard } from "@/components/car-sales/lead-card";
import { NewLeadModal } from "@/components/car-sales/new-lead-modal";
import { LeadDetailsModal } from "@/components/car-sales/lead-details-modal";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  sourceOfLead?: string;
}

interface Lead {
  id: string;
  stage: string;
  carType: string;
  registrationNumber: string;
  commissionAmount?: number;
  purchaseType?: "Cash" | "Bank";
  selectedBank?: string;
  depositAmount?: number;
  paymentDate?: string;
  balanceRemaining?: number;
  reminderDate?: string;
  releaseDate?: string;
  commissionDueDate?: string;
  commissionStatus?: "Pending" | "Paid";
  finalNotes?: string;
  lostReason?: string;
  cancelledReason?: string;
  followUpNotes?: string;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
}

interface PipelineData {
  [stage: string]: Lead[];
}

const STAGES = [
  "New Lead",
  "Follow Up", 
  "Hot Prospect",
  "Deposit Paid",
  "Released",
  "Lost",
  "Cancelled"
];

const STAGE_COLORS = {
  "New Lead": "bg-blue-100 text-blue-800",
  "Follow Up": "bg-yellow-100 text-yellow-800", 
  "Hot Prospect": "bg-orange-100 text-orange-800",
  "Deposit Paid": "bg-purple-100 text-purple-800",
  "Released": "bg-green-100 text-green-800",
  "Lost": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-800"
};

export default function CarSalesPipeline() {
  const [pipeline, setPipeline] = useState<PipelineData>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchPipeline = async () => {
    try {
      const response = await fetch("/api/car-sales/pipeline");
      const data = await response.json();
      setPipeline(data);
    } catch (error) {
      console.error("Error fetching pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleLeadUpdate = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(`/api/car-sales/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchPipeline();
      }
    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const getStageStats = () => {
    const stats = STAGES.map(stage => ({
      stage,
      count: pipeline[stage]?.length || 0,
      color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS]
    }));
    return stats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Car Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your car sales leads through the sales pipeline
          </p>
        </div>
        <Button onClick={() => setShowNewLeadModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {getStageStats().map(({ stage, count, color }) => (
          <Card key={stage} className="p-4">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold mb-2 ${color}`}>
                {count}
              </div>
              <div className="text-xs font-medium">{stage}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by customer name, phone, car type, or registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6 overflow-x-auto">
        {STAGES.map((stage) => (
          <div key={stage} className="space-y-4 min-w-80">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{stage}</span>
                  <Badge className={STAGE_COLORS[stage as keyof typeof STAGE_COLORS]}>
                    {pipeline[stage]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pipeline[stage]?.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onEdit={() => {
                      setSelectedLead(lead);
                      setShowDetailsModal(true);
                    }}
                    onStageChange={(newStage) => 
                      handleLeadUpdate(lead.id, { stage: newStage })
                    }
                  />
                ))}
                {(!pipeline[stage] || pipeline[stage].length === 0) && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No leads in this stage
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showNewLeadModal && (
        <NewLeadModal
          onClose={() => setShowNewLeadModal(false)}
          onSuccess={() => {
            setShowNewLeadModal(false);
            fetchPipeline();
          }}
        />
      )}

      {showDetailsModal && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={(updates) => {
            handleLeadUpdate(selectedLead.id, updates);
            setShowDetailsModal(false);
          }}
        />
      )}
    </div>
  );
}
