"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Car, Building, AlertCircle } from "lucide-react";

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

interface Note {
  id: string;
  notes: string;
  createdAt: string;
  staff?: {
    id: string;
    name: string;
  };
}

interface Reminder {
  id: string;
  reminderDate: string;
  reminderType: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  staff?: {
    id: string;
    name: string;
  };
}

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updates: Partial<Lead>) => void;
}

const KENYA_BANKS = [
  "KCB", "Equity Bank", "Cooperative Bank", "NCBA", "Absa", "Standard Chartered", 
  "Stanbic", "I&M", "Family Bank", "DTB", "SBM", "Kingdom Bank", "Prime Bank", 
  "Credit Bank", "Gulf African Bank"
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

export function LeadDetailsModal({ lead, onClose, onUpdate }: LeadDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().split('T')[0]);
  const [newReminderType, setNewReminderType] = useState("");
  const [newReminderNotes, setNewReminderNotes] = useState("");

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    stage: lead.stage,
    carType: lead.carType,
    registrationNumber: lead.registrationNumber,
    commissionAmount: lead.commissionAmount?.toString() || "",
    purchaseType: lead.purchaseType || "",
    selectedBank: lead.selectedBank || "",
    depositAmount: lead.depositAmount?.toString() || "",
    paymentDate: lead.paymentDate || today,
    balanceRemaining: lead.balanceRemaining?.toString() || "",
    reminderDate: lead.reminderDate || today,
    releaseDate: lead.releaseDate || today,
    commissionStatus: lead.commissionStatus || "Pending",
    finalNotes: lead.finalNotes || "",
    lostReason: lead.lostReason || "",
    cancelledReason: lead.cancelledReason || "",
    followUpNotes: lead.followUpNotes || "",
    nextAction: lead.nextAction || "",
  });

  useEffect(() => {
    fetchNotes();
    fetchReminders();
  }, [lead.id]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/car-sales/leads/${lead.id}/notes`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch(`/api/car-sales/leads/${lead.id}/reminders`);
      const data = await response.json();
      setReminders(data);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch(`/api/car-sales/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: newNote }),
      });

      if (response.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const addReminder = async () => {
    if (!newReminderDate || !newReminderType) return;

    try {
      const response = await fetch(`/api/car-sales/leads/${lead.id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderDate: newReminderDate,
          reminderType: newReminderType,
          notes: newReminderNotes,
        }),
      });

      if (response.ok) {
        setNewReminderDate("");
        setNewReminderType("");
        setNewReminderNotes("");
        fetchReminders();
      }
    } catch (error) {
      console.error("Error adding reminder:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        ...formData,
        commissionAmount: formData.commissionAmount ? parseFloat(formData.commissionAmount) : undefined,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : undefined,
        balanceRemaining: formData.balanceRemaining ? parseFloat(formData.balanceRemaining) : undefined,
        purchaseType: formData.purchaseType as "Cash" | "Bank" | undefined,
      };

      onUpdate(updates);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details - {lead.customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={lead.customer.name} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={lead.customer.phone} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={lead.customer.email || ""} disabled />
              </div>
              <div>
                <Label>Source of Lead</Label>
                <Input value={lead.customer.sourceOfLead || ""} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Car Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Car Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Car Type</Label>
                <Input
                  value={formData.carType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, carType: e.target.value})}
                />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, registrationNumber: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <Label>Commission Amount</Label>
                <Input
                  type="number"
                  value={formData.commissionAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, commissionAmount: e.target.value})}
                  placeholder="KES"
                />
              </div>
              <div>
                <Label>Deposit Amount</Label>
                <Input
                  type="number"
                  value={formData.depositAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, depositAmount: e.target.value})}
                  placeholder="KES"
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, paymentDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Balance Remaining</Label>
                <Input
                  type="number"
                  value={formData.balanceRemaining}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, balanceRemaining: e.target.value})}
                  placeholder="KES"
                />
              </div>
              <div>
                <Label>Reminder Date</Label>
                <Input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, reminderDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Follow Up">Follow Up</SelectItem>
                    <SelectItem value="Hot Prospect">Hot Prospect</SelectItem>
                    <SelectItem value="Deposit Paid">Deposit Paid</SelectItem>
                    <SelectItem value="Released">Released</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stage-specific fields */}
          {(formData.stage === "Hot Prospect" || formData.stage === "Deposit Paid" || formData.stage === "Released") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Type</Label>
                  <Select value={formData.purchaseType} onValueChange={(value) => setFormData({...formData, purchaseType: value as "Cash" | "Bank"})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.purchaseType === "Bank" && (
                  <div>
                    <Label>Bank</Label>
                    <Select value={formData.selectedBank} onValueChange={(value) => setFormData({...formData, selectedBank: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KENYA_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1"
                />
                <Button onClick={addNote}>Add Note</Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-sm flex-1">{note.notes}</p>
                      <Badge variant="outline" className="text-xs">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    {note.staff && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {note.staff.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="date"
                  value={newReminderDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReminderDate(e.target.value)}
                />
                <Input
                  value={newReminderType}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReminderType(e.target.value)}
                  placeholder="Reminder type..."
                />
                <Button onClick={addReminder}>Add Reminder</Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reminder.reminderType}</p>
                        {reminder.notes && <p className="text-xs text-muted-foreground">{reminder.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reminder.isCompleted ? "default" : "outline"} className="text-xs">
                          {reminder.isCompleted ? "Completed" : "Pending"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(reminder.reminderDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
