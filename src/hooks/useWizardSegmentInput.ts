import { useEffect, useRef, useState } from 'react'
import { buildWizardSteps, getBendInteriorAngle } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'
import { useProfileStore } from '@/store/profileStore'

export function useWizardSegmentInput(profile: FoldedProfile) {
  const wizardIndex = useProfileStore((s) => s.wizardIndex)
  const goNext = useProfileStore((s) => s.goNext)
  const goBack = useProfileStore((s) => s.goBack)
  const pushHistory = useProfileStore((s) => s.pushHistory)
  const previewSegmentLength = useProfileStore((s) => s.previewSegmentLength)
  const previewBendAngle = useProfileStore((s) => s.previewBendAngle)

  const steps = buildWizardSteps(profile)
  const current = steps[wizardIndex]
  const stepKey = current ? `${wizardIndex}-${current.type}-${current.id}` : ''
  const historyLength = useProfileStore((s) => s.history.length)
  const [inputValue, setInputValue] = useState('')
  /** First keypad press replaces the prefilled value instead of appending. */
  const replaceOnNextKey = useRef(false)

  useEffect(() => {
    const step = buildWizardSteps(profile)[wizardIndex]
    if (!step) return

    const shouldClear = useProfileStore.getState().consumeClearWizardInput()
    if (shouldClear) {
      setInputValue('')
      replaceOnNextKey.current = false
      return
    }

    if (step.type === 'segment') {
      const seg = profile.segments.find((s) => s.id === step.id)
      setInputValue(seg ? String(seg.length) : '')
    } else {
      const bend = profile.bends.find((b) => b.id === step.id)
      setInputValue(bend ? String(getBendInteriorAngle(bend)) : '')
    }
    replaceOnNextKey.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stepKey + historyLength are intentional triggers
  }, [stepKey, historyLength])

  const consumeReplaceOnNextKey = () => {
    if (!replaceOnNextKey.current) return false
    replaceOnNextKey.current = false
    return true
  }

  const applyPreview = (raw: string) => {
    if (!current) return
    const num = parseFloat(raw)
    if (!Number.isFinite(num) || num <= 0) return
    if (current.type === 'segment') {
      previewSegmentLength(current.id, num)
    } else {
      previewBendAngle(current.id, num)
    }
  }

  const setValue = (raw: string) => {
    setInputValue(raw)
    applyPreview(raw)
  }

  const appendDigit = (digit: string) => {
    if (consumeReplaceOnNextKey()) {
      setValue(digit)
      return
    }
    const next =
      inputValue === '0' && digit !== '.'
        ? digit
        : inputValue + digit
    setValue(next)
  }

  const appendDecimal = () => {
    if (consumeReplaceOnNextKey()) {
      setValue('0.')
      return
    }
    if (inputValue.includes('.')) return
    setValue(inputValue ? `${inputValue}.` : '0.')
  }

  const backspace = () => {
    replaceOnNextKey.current = false
    setValue(inputValue.slice(0, -1))
  }

  const clear = () => {
    replaceOnNextKey.current = false
    setValue('')
  }

  const handleNext = () => {
    if (!current) return
    const num = parseFloat(inputValue)
    if (!Number.isFinite(num) || num <= 0) return

    pushHistory()
    if (current.type === 'segment') {
      previewSegmentLength(current.id, num)
    } else {
      previewBendAngle(current.id, num)
    }
    goNext()
  }

  const handleBack = () => {
    goBack()
  }

  const unit = current?.type === 'segment' ? 'mm' : '°'
  const canGoBack = wizardIndex > 0
  const canGoNext = (() => {
    const num = parseFloat(inputValue)
    return Number.isFinite(num) && num > 0
  })()

  return {
    current,
    inputValue,
    unit,
    canGoBack,
    canGoNext,
    appendDigit,
    appendDecimal,
    backspace,
    clear,
    handleNext,
    handleBack,
  }
}
