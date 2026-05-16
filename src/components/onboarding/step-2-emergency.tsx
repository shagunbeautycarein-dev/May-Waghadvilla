"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users } from "lucide-react";
import type { Step2Emergency, EmergencyContact } from "@/types/onboarding";

interface Props {
  data?: Step2Emergency;
  onNext: (data: Step2Emergency) => void;
  onBack: () => void;
}

export function Step2Emergency({ data, onNext, onBack }: Props) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    data?.contacts?.length ? data.contacts : [
      { name: "", relation: "", mobile: "", city: "" },
    ]
  );

  const addContact = () => {
    setContacts([...contacts, { name: "", relation: "", mobile: "", city: "" }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ contacts });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {contacts.map((contact, index) => (
        <div key={index} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              <h4 className="text-sm font-semibold text-slate-900">Contact {index + 1}</h4>
            </div>
            {contacts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeContact(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Name *</Label>
              <Input
                value={contact.name}
                onChange={(e) => updateContact(index, "name", e.target.value)}
                required
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Relation *</Label>
              <Input
                value={contact.relation}
                onChange={(e) => updateContact(index, "relation", e.target.value)}
                required
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Mobile *</Label>
              <Input
                value={contact.mobile}
                onChange={(e) => updateContact(index, "mobile", e.target.value)}
                required
                pattern="[0-9]{10}"
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">City *</Label>
              <Input
                value={contact.city}
                onChange={(e) => updateContact(index, "city", e.target.value)}
                required
                className="rounded-xl border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addContact}
        className="w-full rounded-xl border-dashed border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50/50 h-11"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Contact
      </Button>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 rounded-full h-11 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          Previous
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white h-11"
        >
          Continue
        </Button>
      </div>
    </form>
  );
}
