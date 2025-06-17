import { create } from 'zustand';

interface EmailPreviewState {
  currentEmailIndex: number;
  emails: Array<{
    contactId: string;
    email: string;
    subject: string;
  }>;
  isVisible: boolean;
  setEmails: (emails: EmailPreviewState['emails']) => void;
  updateEmail: (index: number, email: string) => void;
  setCurrentIndex: (index: number) => void;
  setVisible: (visible: boolean) => void;
  reset: () => void;
}

export const useEmailPreviewStore = create<EmailPreviewState>((set) => ({
  currentEmailIndex: 0,
  emails: [],
  isVisible: false,
  
  setEmails: (emails) => set({ emails, currentEmailIndex: 0, isVisible: emails.length > 0 }),
  
  updateEmail: (index, email) => set((state) => ({
    emails: state.emails.map((e, i) => i === index ? { ...e, email } : e)
  })),
  
  setCurrentIndex: (index) => set({ currentEmailIndex: index }),
  
  setVisible: (visible) => set({ isVisible: visible }),
  
  reset: () => set({
    currentEmailIndex: 0,
    emails: [],
    isVisible: false
  })
}));