import { useEmailStore } from '@/store/slices/emailStore'

export const useEmailPresets = () => {
  const { presets, savePreset, loadPreset } = useEmailStore()
  
  return {
    presets: Object.entries(presets).map(([name, settings]) => ({
      name,
      settings
    })),
    savePreset,
    loadPreset
  }
}