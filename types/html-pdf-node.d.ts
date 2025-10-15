declare module 'html-pdf-node' {
  interface Options {
    format?: string
    orientation?: string
    border?: {
      top?: string
      right?: string
      bottom?: string
      left?: string
    }
    paginationOffset?: number
    header?: {
      height?: string
    }
    footer?: {
      height?: string
    }
    type?: string
    quality?: string
    renderDelay?: number
    phantomArgs?: string[]
  }

  interface File {
    content: string
    url?: string
  }

  function generatePdf(file: File, options?: Options): Promise<Buffer>
  
  export = { generatePdf }
}
