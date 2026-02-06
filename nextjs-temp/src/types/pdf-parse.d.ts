declare module 'pdf-parse' {
    interface PDFData {
        numpages: number;
        numrender: number;
        info: Record<string, unknown>;
        metadata: Record<string, unknown>;
        text: string;
        version: string;
    }

    interface PageData {
        pageIndex: number;
        pageId: string;
        pageContent?: string;
    }

    function parse(dataBuffer: Buffer, options?: {
        pagerender?: (pageData: PageData) => string;
        max?: number;
        version?: string;
    }): Promise<PDFData>;

    export = parse;
}

declare module 'pdf-parse/lib/pdf-parse.js' {
    import parse from 'pdf-parse';
    export default parse;
}