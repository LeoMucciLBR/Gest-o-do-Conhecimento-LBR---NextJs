declare module 'react-quill-new' {
  import React from 'react';
  export interface ReactQuillProps {
    theme?: string;
    modules?: any;
    formats?: string[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    [key: string]: any;
  }
  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}
