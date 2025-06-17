'use client'

import { useEffect, useState } from 'react';
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { useAppStore } from '@/store';
import { runEmailGeneratorSmokeTest } from '@/utils/diagnoseGemini';
import { FlaskConical } from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  icon?: React.ReactNode;
  devOnly?: boolean;
}

export function CommandPalette() {
  const isCommandPaletteOpen = useAppStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useAppStore((state) => state.toggleCommandPalette);
  const [search, setSearch] = useState('');
  
  const isDev = process.env.NODE_ENV === 'development';
  
  const commands: CommandItem[] = [
    {
      id: 'smoke-test',
      label: 'Run Email Generator Smoke Test',
      shortcut: '⇧⌘P',
      icon: <FlaskConical className="h-4 w-4" />,
      devOnly: true,
      action: async () => {
        toggleCommandPalette();
        await runEmailGeneratorSmokeTest();
      }
    }
  ].filter(cmd => !cmd.devOnly || isDev);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);
  
  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={toggleCommandPalette}>
      <Command>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Developer Tools">
            {commands.map(cmd => (
              <CommandItem
                key={cmd.id}
                onSelect={cmd.action}
                className="flex items-center gap-2"
              >
                {cmd.icon}
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}