import type { LucideIcon } from 'lucide-react'
import { FileText, Package } from 'lucide-react'
import type { PackageMode } from '@/lib/packageMode'

export type { PackageMode }

export interface PackageOption {
  id: PackageMode
  icon: LucideIcon
  title: string
  description: string
}

export const PROJECT_PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'drawings',
    icon: FileText,
    title: 'Only drawings',
    description: 'One combined PDF with every plate drawing.',
  },
  {
    id: 'full',
    icon: Package,
    title: 'Full package',
    description: 'Plates list, combined PDF, and one PDF per plate.',
  },
]

export const PLATE_PACKAGE_OPTIONS: PackageOption[] = [
  {
    id: 'drawings',
    icon: FileText,
    title: 'Only drawing',
    description: 'PDF drawing for this plate.',
  },
  {
    id: 'full',
    icon: Package,
    title: 'Full package',
    description: 'Drawing, cut list, and preview.',
  },
]
