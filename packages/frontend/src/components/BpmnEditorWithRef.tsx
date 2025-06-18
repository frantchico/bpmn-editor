import React, { forwardRef, useImperativeHandle } from 'react'
import BpmnEditor, { type BpmnEditorHandles, type BpmnEditorComponentProps } from './BpmnEditor'
import type { ElementProperties } from '@/types'
import type BpmnModeler from 'bpmn-js/lib/Modeler'; // Ensure BpmnModeler type is available

const BpmnEditorWithRef = forwardRef<BpmnEditorHandles, BpmnEditorComponentProps>((props, ref) => {
  const editorRef = React.useRef<BpmnEditorHandles | null>(null)

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
      const modeler = editorRef.current?.getModeler?.();
      return modeler || null; // Ensure null is returned if undefined
    }
  }))

  return <BpmnEditor ref={editorRef} {...props} />
})

BpmnEditorWithRef.displayName = 'BpmnEditorWithRef'

export default BpmnEditorWithRef

