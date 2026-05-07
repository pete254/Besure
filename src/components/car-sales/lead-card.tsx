"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Phone, 
  DollarSign, 
  Calendar, 
  Building, 
  AlertCircle,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface LeadCardProps {
  lead: Lead;
  onEdit: () => void;
  onStageChange: (newStage: string) => void;
}

const STAGE_COLORS = {
  "New Lead": "bg-blue-100 text-blue-800",
  "Follow Up": "bg-yellow-100 text-yellow-800", 
  "Hot Prospect": "bg-orange-100 text-orange-800",
  "Deposit Paid": "bg-purple-100 text-purple-800",
  "Released": "bg-green-100 text-green-800",
  "Lost": "bg-red-100 text-red-800",
  "Cancelled": "bg-gray-100 text-gray-800"
};

const NEXT_STAGES = {
  "New Lead": ["Follow Up", "Lost", "Cancelled"],
  "Follow Up": ["Hot Prospect", "Lost", "Cancelled"],
  "Hot Prospect": ["Deposit Paid", "Lost", "Cancelled"],
  "Deposit Paid": ["Released", "Lost", "Cancelled"],
  "Released": [],
  "Lost": ["New Lead", "Follow Up"],
  "Cancelled": ["New Lead", "Follow Up"]
};

export function LeadCard({ lead, onEdit, onStageChange }: LeadCardProps) {
  const hasReminder = lead.reminderDate && new Date(lead.reminderDate) <= new Date();
  const hasOverdueCommission = lead.commissionDueDate && 
    new Date(lead.commissionDueDate) < new Date() && 
    lead.commissionStatus === "Pending";

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onEdit}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{lead.customer.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Phone className="w-3 h-3 mr-1" />
              {lead.customer.phone}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {NEXT_STAGES[lead.stage as keyof typeof NEXT_STAGES]?.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageChange(stage);
                  }}
                >
                  <ChevronRight className="w-3 h-3 mr-2" />
                  Move to {stage}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
                Edit Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Car Details */}
        <div className="space-y-2">
          <div className="flex items-center text-xs">
            <Car className="w-3 h-3 mr-2 text-muted-foreground" />
            <span className="font-medium">{lead.carType}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Reg: {lead.registrationNumber}
          </div>
        </div>

        {/* Stage-specific info */}
        {lead.commissionAmount && (
          <div className="flex items-center text-xs">
            <DollarSign className="w-3 h-3 mr-2 text-green-600" />
            <span className="text-green-600 font-medium">
              KES {lead.commissionAmount.toLocaleString()}
            </span>
          </div>
        )}

        {lead.purchaseType && (
          <div className="flex items-center text-xs">
            {lead.purchaseType === "Bank" && lead.selectedBank ? (
              <>
                <Building className="w-3 h-3 mr-2 text-blue-600" />
                <span className="text-blue-600">{lead.selectedBank}</span>
              </>
            ) : (
              <Badge variant="outline" className="text-xs">
                {lead.purchaseType}
              </Badge>
            )}
          </div>
        )}

        {lead.depositAmount && (
          <div className="flex items-center text-xs">
            <DollarSign className="w-3 h-3 mr-2 text-purple-600" />
            <span className="text-purple-600">
              Deposit: KES {lead.depositAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Alerts */}
        {(hasReminder || hasOverdueCommission) && (
          <div className="space-y-1">
            {hasReminder && (
              <div className="flex items-center text-xs text-orange-600">
                <Calendar className="w-3 h-3 mr-1" />
                Reminder due
              </div>
            )}
            {hasOverdueCommission && (
              <div className="flex items-center text-xs text-red-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Commission overdue
              </div>
            )}
          </div>
        )}

        {/* Lost/Cancelled Reason */}
        {(lead.lostReason || lead.cancelledReason) && (
          <div className="text-xs text-muted-foreground italic">
            {lead.lostReason || lead.cancelledReason}
          </div>
        )}

        {/* Stage Badge */}
        <div className="pt-2 border-t">
          <Badge className={`text-xs ${STAGE_COLORS[lead.stage as keyof typeof STAGE_COLORS]}`}>
            {lead.stage}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
