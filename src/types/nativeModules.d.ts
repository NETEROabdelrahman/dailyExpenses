declare module 'react-native-html-to-pdf' {
  type PdfOptions = {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
  };

  type PdfResult = {
    filePath?: string;
    base64?: string;
  };

  export function generatePDF(options: PdfOptions): Promise<PdfResult>;
}

declare module 'react-native-share' {
  type ShareOptions = {
    title?: string;
    message?: string;
    url?: string;
    type?: string;
    filename?: string;
    useInternalStorage?: boolean;
    failOnCancel?: boolean;
  };

  const Share: {
    open(options: ShareOptions): Promise<unknown>;
  };

  export default Share;
}
