import * as React from 'react'

interface UseFilePickerOptions {
   accept?: string
   multiple?: boolean
   onFileSelect?: (files: File[]) => void
}

interface UseFilePickerReturn {
   files: File[]
   clear: () => void
   onSelectFile: () => void
}

export function useFilePicker({
   accept,
   multiple = false,
   onFileSelect
}: UseFilePickerOptions = {}): UseFilePickerReturn {
   const [files, setFiles] = React.useState<File[]>([])
   const inputRef = React.useRef<HTMLInputElement | null>(null)

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
