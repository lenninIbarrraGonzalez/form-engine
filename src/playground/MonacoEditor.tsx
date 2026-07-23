// MonacoEditor — thin wrapper around @monaco-editor/react.
// This file is loaded lazily from Playground.tsx via React.lazy so that
// Monaco assets land in a separate chunk and do not affect initial load.
import Editor from '@monaco-editor/react'

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MonacoEditor({ value, onChange }: MonacoEditorProps) {
  return (
    <Editor
      height="100%"
      defaultLanguage="json"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
        fontSize: 14,
        tabSize: 2,
        scrollBeyondLastLine: false,
      }}
    />
  )
}
