/**
 *  @title File Picker Hook
 *  @notice A custom React hook that provides file selection functionality
 *  @dev Creates and manages a hidden file input element
 */

import * as React from 'react'

/** @dev Interface for hook options */
interface UseFilePickerOptions {
   accept?: string
   multiple?: boolean
   onFileSelect?: (files: File[]) => void
}

/** @dev Interface for hook return value */
interface UseFilePickerReturn {
   files: File[]
   clear: () => void
   onSelectFile: () => void
}

/** @notice Creates a file picker with state management
 *  @param accept File types to accept
 *  @param multiple Allow multiple file selection
 *  @param onFileSelect Callback for file selection
 *  @return Object containing files and control functions
 */
export function useFilePicker({
   accept,
   multiple = false,
   onFileSelect
}: UseFilePickerOptions = {}): UseFilePickerReturn {
   /** @dev Initialize states and refs */
   const [files, setFiles] = React.useState<File[]>([])
   const inputRef = React.useRef<HTMLInputElement | null>(null)

   /** @dev Handler functions */
   const openFilePicker = () => inputRef.current?.click()

   const handleFileChange = React.useCallback(
      async (event: Event) => {
         const fileList = (event.target as HTMLInputElement).files
         if (fileList) {
            const filesArray = Array.from(fileList)
            setFiles(filesArray)
            await onFileSelect?.(filesArray)
         }
      },
      [onFileSelect]
   )

   const clearFiles = () => {
      setFiles([])
      if (inputRef.current) {
         inputRef.current.value = ''
      }
   }

   /** @dev Set up file input element */
   React.useEffect(() => {
      const input = document.createElement('input')
      input.type = 'file'
      input.style.display = 'none'
      if (accept) input.accept = accept
      if (multiple) input.multiple = multiple
      input.addEventListener('change', handleFileChange)

      if (inputRef.current !== input) {
         inputRef.current = input
      }
      document.body.appendChild(input)

      return () => {
         input.removeEventListener('change', handleFileChange)
         document.body.removeChild(input)
      }
   }, [accept, multiple, handleFileChange])

   return {
      files,
      onSelectFile: openFilePicker,
      clear: clearFiles
   }
}
