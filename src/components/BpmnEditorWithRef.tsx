import React, { forwardRef, useImperativeHandle } from 'react'
import BpmnEditor from './BpmnEditor'
import type { BpmnEditorProps, ElementProperties } from '@/types'

export interface BpmnEditorRef {
  save: () => Promise<void>
  export: (format: 'bpmn' | 'svg' | 'png') => Promise<void>
  updateElementProperties: (properties: Partial<ElementProperties>) => void
  getModeler: () => any
}

const BpmnEditorWithRef = forwardRef<BpmnEditorRef, BpmnEditorProps>((props, ref) => {
  const editorRef = React.useRef<any>(null)

  useImperativeHandle(ref, () => ({
    save: async () => {
      if (editorRef.current?.save) {
        await editorRef.current.save()
      }
    },
    export: async (format: 'bpmn' | 'svg' | 'png') => {
      if (editorRef.current?.export) {
        await editorRef.current.export(format)
      }
    },
    updateElementProperties: (properties: Partial<ElementProperties>) => {
      if (editorRef.current?.updateElementProperties) {
        editorRef.current.updateElementProperties(properties)
      }
    },
    getModeler: () => {
      return editorRef.current?.getModeler?.()
    }
  }))

  return <BpmnEditor ref={editorRef} {...props} />
})

BpmnEditorWithRef.displayName = 'BpmnEditorWithRef'

export default BpmnEditorWithRef

